const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const ExcelJS = require('exceljs');
const yargs = require('yargs');
const JSON5 = require('json5');
const xml2js = require('xml2js');

function substituteVars(str, vars) {
  return str.replace(/\$\{(\w+)\}/g, (_, v) => vars[v] ?? '');
}

async function loadQueriesFromXML(xmlPath) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const parsed = await xml2js.parseStringPromise(xml, { trim: true });
  if (!parsed.queries || !parsed.queries.sheet) throw new Error('Invalid XML format');
  // 전역 변수 파싱
  let globalVars = {};
  if (parsed.queries.vars && parsed.queries.vars[0] && parsed.queries.vars[0].var) {
    for (const v of parsed.queries.vars[0].var) {
      if (v.$ && v.$.name && v._) {
        globalVars[v.$.name] = v._.toString();
      } else if (v.$ && v.$.name && typeof v === 'string') {
        globalVars[v.$.name] = v;
      }
    }
  }
  // DB ID, output 경로 파싱
  let dbId = undefined;
  if (parsed.queries.db && parsed.queries.db[0] && parsed.queries.db[0].$ && parsed.queries.db[0].$.id) {
    dbId = parsed.queries.db[0].$.id;
  }
  let outputPath = undefined;
  if (parsed.queries.output && parsed.queries.output[0]) {
    outputPath = parsed.queries.output[0];
  }
  const sheets = parsed.queries.sheet.map(s => ({
    name: s.$.name,
    query: (s._ || (s["_"] ? s["_"] : (s["$"] ? s["$"] : '')) || (s["__cdata"] ? s["__cdata"] : '') || (s["cdata"] ? s["cdata"] : '') || (s["#cdata-section"] ? s["#cdata-section"] : '') || (s["__text"] ? s["__text"] : '') || (s["#text"] ? s["#text"] : '') || (s["$text"] ? s["$text"] : '') || (s["$value"] ? s["$value"] : '') || (s["value"] ? s["value"] : '') || '').toString().trim()
  }));
  return { globalVars, sheets, dbId, outputPath };
}

function resolvePath(p) {
  if (!p) return '';
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

function printAvailableXmlFiles() {
  const dir = path.join(process.cwd(), 'resources');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml'));
  if (files.length > 0) {
    console.log('[INFO] 사용 가능한 XML 쿼리 정의 파일 목록:');
    files.forEach(f => console.log('  - resources/' + f));
  } else {
    console.log('[INFO] resources 폴더에 XML 쿼리 정의 파일이 없습니다.');
  }
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getNowTimestampStr() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function parseColWidths(colwidths, colCount) {
  // colwidths: {min, max} or undefined
  // colCount: 실제 컬럼 개수
  return function(lengths) {
    // lengths: 각 컬럼별 최대 문자열 길이 배열
    let min = 10, max = 30;
    if (colwidths && typeof colwidths === 'object') {
      if (colwidths.min) min = Number(colwidths.min);
      if (colwidths.max) max = Number(colwidths.max);
    }
    return lengths.map(len => Math.max(min, Math.min(max, len)));
  };
}

function parseBorder(border) {
  // border: {all, top, left, right, bottom}
  if (!border) return undefined;
  const makeSide = (side) => border[side] ? { style: border[side].style, color: border[side].color ? { argb: border[side].color } : undefined } : undefined;
  if (border.all) {
    const side = makeSide('all');
    return { top: side, left: side, right: side, bottom: side };
  }
  return {
    top: makeSide('top'),
    left: makeSide('left'),
    right: makeSide('right'),
    bottom: makeSide('bottom')
  };
}

async function main() {
  printAvailableXmlFiles();

  const argv = yargs
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: 'resources/queries.json' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: 'resources/queries.xml' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'resources/config.json' })
    .option('db', { describe: 'DB 접속 ID (config.json의 dbs 키)', default: '' })
    .option('out', { alias: 'o', describe: '엑셀 출력 파일명', default: '' })
    .option('var', { alias: 'v', describe: '쿼리 변수 (key=value)', array: true, default: [] })
    .help().argv;

  // CLI 변수 파싱
  const cliVars = {};
  for (const v of argv.var) {
    const [key, value] = v.split('=');
    cliVars[key] = value;
  }

  let sheets, globalVars = {}, dbId, outputPath;
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    const xmlResult = await loadQueriesFromXML(resolvePath(argv.xml));
    globalVars = xmlResult.globalVars;
    sheets = xmlResult.sheets;
    dbId = xmlResult.dbId;
    outputPath = xmlResult.outputPath;
  } else if (argv.query && fs.existsSync(resolvePath(argv.query))) {
    const queries = JSON5.parse(fs.readFileSync(resolvePath(argv.query), 'utf8'));
    globalVars = queries.vars || {};
    sheets = queries.sheets;
    dbId = queries.db;
    outputPath = queries.output;
  } else {
    throw new Error('쿼리 정의 파일을 찾을 수 없습니다. --query 또는 --xml 옵션을 확인하세요.');
  }

  // CLI 변수 > 파일 전역변수 우선 적용
  const mergedVars = { ...globalVars, ...cliVars };

  // 엑셀 전체 스타일 파싱 및 db/output 우선 적용
  let excelStyle = {};
  let excelDb = undefined;
  let excelOutput = undefined;
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    const xml = fs.readFileSync(resolvePath(argv.xml), 'utf8');
    const parsed = await xml2js.parseStringPromise(xml, { trim: true });
    if (parsed.queries && parsed.queries.excel && parsed.queries.excel[0]) {
      const excel = parsed.queries.excel[0];
      if (excel.$ && excel.$.db) excelDb = excel.$.db;
      if (excel.$ && excel.$.output) excelOutput = excel.$.output;
      excelStyle.header = {};
      excelStyle.body = {};
      if (excel.header && excel.header[0]) {
        const h = excel.header[0];
        if (h.font && h.font[0] && h.font[0].$) excelStyle.header.font = h.font[0].$;
        if (h.fill && h.fill[0] && h.fill[0].$) excelStyle.header.fill = h.fill[0].$;
        if (h.colwidths && h.colwidths[0] && h.colwidths[0].$) excelStyle.header.colwidths = h.colwidths[0].$;
      }
      if (excel.body && excel.body[0]) {
        const b = excel.body[0];
        if (b.font && b.font[0] && b.font[0].$) excelStyle.body.font = b.font[0].$;
        if (b.fill && b.fill[0] && b.fill[0].$) excelStyle.body.fill = b.fill[0].$;
      }
    }
  } else if (argv.query && fs.existsSync(resolvePath(argv.query))) {
    const queries = JSON5.parse(fs.readFileSync(resolvePath(argv.query), 'utf8'));
    if (queries.excel) {
      excelStyle = queries.excel;
      if (queries.excel.db) excelDb = queries.excel.db;
      if (queries.excel.output) excelOutput = queries.excel.output;
    }
  }

  // DB 접속 정보 로드 (멀티 DB 지원)
  const configPath = resolvePath(argv.config);
  if (!fs.existsSync(configPath)) {
    throw new Error(`DB 접속 정보 파일이 존재하지 않습니다: ${configPath}`);
  }
  const configObj = JSON5.parse(fs.readFileSync(configPath, 'utf8'));
  const dbKey = argv.db || excelDb || dbId || 'main';
  if (!configObj.dbs || !configObj.dbs[dbKey]) {
    throw new Error(`DB 접속 ID를 찾을 수 없습니다: ${dbKey}`);
  }
  const dbConfig = configObj.dbs[dbKey];
  const pool = new mssql.ConnectionPool(dbConfig);
  await pool.connect();

  // 엑셀 파일 경로 결정 (CLI > excel > 쿼리파일 > 기본값)
  let outFile = argv.out || excelOutput || outputPath || 'output.xlsx';
  outFile = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
  // 파일명에 _yyyymmddhhmmss 추가
  const ext = path.extname(outFile);
  const base = outFile.slice(0, -ext.length);
  outFile = `${base}_${getNowTimestampStr()}${ext}`;
  ensureDirExists(outFile);

  console.log('-------------------------------------------------------------------------------');
  console.log(`[${outFile}] START WORK`);
  console.log('-------------------------------------------------------------------------------');
  const workbook = new ExcelJS.Workbook();
  const createdSheetNames = [];

  for (const sheetDef of sheets) {
    // use 속성 체크
    let use = true;
    if (typeof sheetDef.use !== 'undefined') {
      if (sheetDef.use === false || sheetDef.use === 0 || sheetDef.use === 'false' || sheetDef.use === '0') use = false;
    } else if (sheetDef.hasOwnProperty('$') && typeof sheetDef.$.use !== 'undefined') {
      // XML 파싱 시
      if (sheetDef.$.use === 'false' || sheetDef.$.use === '0') use = false;
    }
    if (!use) {
      console.log(`[SKIP] Sheet '${sheetDef.name}' is disabled (use=false)`);
      continue;
    }
    const sql = substituteVars(sheetDef.query, mergedVars);
    const sheetName = substituteVars(sheetDef.name, mergedVars);
    console.log(`[INFO] Executing for sheet '${sheetName}'`);
    try {
      const result = await pool.request().query(sql);
      const sheet = workbook.addWorksheet(sheetName);
      createdSheetNames.push(sheetName);
      if (result.recordset.length > 0) {
        // 컬럼 정보
        const columns = Object.keys(result.recordset[0]);
        // 컬럼 너비 자동 계산 (min/max)
        let colwidths = excelStyle.header?.colwidths;
        let min = 10, max = 30;
        if (colwidths && typeof colwidths === 'object') {
          if (colwidths.min) min = Number(colwidths.min);
          if (colwidths.max) max = Number(colwidths.max);
        }
        // 각 컬럼별 최대 길이 계산
        const colMaxLens = columns.map((col, idx) => {
          let maxLen = col.length;
          for (const row of result.recordset) {
            const val = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
            if (val.length > maxLen) maxLen = val.length;
          }
          return Math.max(min, Math.min(max, maxLen));
        });
        sheet.columns = columns.map((key, i) => ({ header: key, key, width: colMaxLens[i] }));
        sheet.addRows(result.recordset);
        // 헤더 셀별 스타일 적용
        if (excelStyle.header) {
          for (let i = 1; i <= columns.length; i++) {
            const cell = sheet.getRow(1).getCell(i);
            if (excelStyle.header.font) {
              cell.font = {
                name: excelStyle.header.font?.name,
                size: excelStyle.header.font?.size ? Number(excelStyle.header.font.size) : undefined,
                color: excelStyle.header.font?.color ? { argb: excelStyle.header.font.color } : undefined,
                bold: excelStyle.header.font?.bold === 'true' || excelStyle.header.font?.bold === true
              };
            }
            if (excelStyle.header.fill?.color) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: excelStyle.header.fill.color }
              };
            }
            if (excelStyle.header.alignment) {
              cell.alignment = { ...excelStyle.header.alignment };
            }
            if (excelStyle.header.border) {
              cell.border = parseBorder(excelStyle.header.border);
            }
          }
        }
        // 데이터 셀별 스타일 적용
        if (excelStyle.body) {
          for (let r = 0; r < result.recordset.length; r++) {
            const row = sheet.getRow(r + 2);
            for (let i = 1; i <= columns.length; i++) {
              const cell = row.getCell(i);
              if (excelStyle.body.font) {
                cell.font = {
                  name: excelStyle.body.font?.name,
                  size: excelStyle.body.font?.size ? Number(excelStyle.body.font.size) : undefined,
                  color: excelStyle.body.font?.color ? { argb: excelStyle.body.font.color } : undefined,
                  bold: excelStyle.body.font?.bold === 'true' || excelStyle.body.font?.bold === true
                };
              }
              if (excelStyle.body.fill?.color) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: excelStyle.body.fill.color }
                };
              }
              if (excelStyle.body.alignment) {
                cell.alignment = { ...excelStyle.body.alignment };
              }
              if (excelStyle.body.border) {
                cell.border = parseBorder(excelStyle.body.border);
              }
            }
          }
        }
      }
      console.log(`\t---> ${result.recordset.length} rows were selected `);
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(`${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
  }
  // 목차 시트 추가
  if (createdSheetNames.length > 0) {
    const tocSheet = workbook.addWorksheet('목차');
    tocSheet.addRow(['No', 'Sheet Name']);
    createdSheetNames.forEach((name, idx) => {
      const row = tocSheet.addRow([idx + 1, name]);
      // 시트명에 하이퍼링크 추가
      row.getCell(2).value = {
        text: name,
        hyperlink: `#'${name}'!A1`
      };
      row.getCell(2).font = { color: { argb: '0563C1' }, underline: true };
    });
    // 목차 시트를 첫 번째로 이동
    workbook.worksheets = [tocSheet, ...workbook.worksheets.filter(ws => ws.name !== '목차')];
    // 간단한 스타일
    tocSheet.getRow(1).font = { bold: true };
    tocSheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Sheet Name', key: 'name', width: 30 }
    ];
  }

  await workbook.xlsx.writeFile(outFile);
  console.log(`\n\n[${outFile}] Excel file created `);
  console.log('-------------------------------------------------------------------------------\n\n');
  await pool.close();
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
} 