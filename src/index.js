const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const ExcelJS = require('exceljs');
const yargs = require('yargs');
const JSON5 = require('json5');
const xml2js = require('xml2js');
const excelStyleHelper = require('./excel-style-helper');

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

// parseBorder 함수는 excel-style-helper.js로 이동됨

/**
 * XML 형식의 border 요소를 JSON 형식으로 변환
 * @param {Object} xmlBorder - XML에서 파싱된 border 객체
 * @returns {Object} JSON 형식의 border 객체
 */
function parseXmlBorder(xmlBorder) {
  const result = {};
  
  // <border><all style="thin" color="000000"/></border> 형식 처리
  if (xmlBorder.all && xmlBorder.all[0] && xmlBorder.all[0].$) {
    result.all = xmlBorder.all[0].$;
  }
  
  // 개별 방향별 테두리 처리
  if (xmlBorder.top && xmlBorder.top[0] && xmlBorder.top[0].$) {
    result.top = xmlBorder.top[0].$;
  }
  if (xmlBorder.left && xmlBorder.left[0] && xmlBorder.left[0].$) {
    result.left = xmlBorder.left[0].$;
  }
  if (xmlBorder.right && xmlBorder.right[0] && xmlBorder.right[0].$) {
    result.right = xmlBorder.right[0].$;
  }
  if (xmlBorder.bottom && xmlBorder.bottom[0] && xmlBorder.bottom[0].$) {
    result.bottom = xmlBorder.bottom[0].$;
  }
  
  return result;
}

function isSheetEnabled(sheetDef) {
  let use = true;
  // JSON: use 속성
  if (typeof sheetDef.use !== 'undefined') {
    if (
      sheetDef.use === false ||
      sheetDef.use === 0 ||
      sheetDef.use === 'false' ||
      sheetDef.use === '0' ||
      sheetDef.use === '' ||
      sheetDef.use === null
    ) use = false;
  }
  // XML: $.use 속성
  else if (sheetDef.hasOwnProperty('$') && typeof sheetDef.$.use !== 'undefined') {
    const val = sheetDef.$.use;
    if (
      val === false ||
      val === 0 ||
      val === 'false' ||
      val === '0' ||
      val === '' ||
      val === null
    ) use = false;
  }
  return use;
}

async function main() {
  printAvailableXmlFiles();

  const argv = yargs
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: 'resources/queries.json' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: 'resources/queries.xml' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'config/dbinfo.json' })
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
        if (h.alignment && h.alignment[0] && h.alignment[0].$) {
          excelStyle.header.alignment = h.alignment[0].$;
        }
        if (h.border && h.border[0]) {
          excelStyle.header.border = parseXmlBorder(h.border[0]);
        }
      }
      if (excel.body && excel.body[0]) {
        const b = excel.body[0];
        if (b.font && b.font[0] && b.font[0].$) excelStyle.body.font = b.font[0].$;
        if (b.fill && b.fill[0] && b.fill[0].$) excelStyle.body.fill = b.fill[0].$;
        if (b.alignment && b.alignment[0] && b.alignment[0].$) {
          excelStyle.body.alignment = b.alignment[0].$;
        }
        if (b.border && b.border[0]) {
          excelStyle.body.border = parseXmlBorder(b.border[0]);
        }
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

  // 목차 시트를 맨 처음에 생성 (내용은 나중에 채움)
  let tocSheet = null;
  
  for (const sheetDef of sheets) {
    // robust use 속성 체크
    if (!isSheetEnabled(sheetDef)) {
      console.log(`[SKIP] Sheet '${sheetDef.name}' is disabled (use=false)`);
      continue;
    }
    
    // 첫 번째 활성 시트일 때 목차 시트 생성
    if (!tocSheet) {
      tocSheet = workbook.addWorksheet('목차');
      console.log(`[목차] 맨 첫 번째 시트로 생성됨`);
    }
    
    const sql = substituteVars(sheetDef.query, mergedVars);
    const sheetName = substituteVars(sheetDef.name, mergedVars);
    console.log(`[INFO] Executing for sheet '${sheetName}'`);
    try {
      const result = await pool.request().query(sql);
      const sheet = workbook.addWorksheet(sheetName);
      const recordCount = result.recordset.length;
      createdSheetNames.push({ 
        displayName: sheetDef.name, 
        tabName: sheetName, 
        recordCount: recordCount 
      });
      if (recordCount > 0) {
        // 헬퍼 함수를 사용하여 시트에 데이터와 스타일 적용
        excelStyleHelper.applySheetStyle(sheet, result.recordset, excelStyle);
      }
      console.log(`\t---> ${recordCount} rows were selected `);
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(`${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
  }
  
  // 목차 시트 내용 채우기 (시트는 이미 맨 처음에 생성됨)
  if (createdSheetNames.length > 0 && tocSheet) {
    excelStyleHelper.populateTableOfContents(tocSheet, createdSheetNames);
    console.log(`[목차] 시트 내용 생성 완료 (맨 왼쪽 위치)`);

    // 별도 목차 엑셀 파일 생성
    const tocWb = new ExcelJS.Workbook();
    excelStyleHelper.createExternalTableOfContents(tocWb, createdSheetNames, outFile);
    
    // 파일명: 기존 outFile 기준 _목차_yyyymmddhhmmss.xlsx
    const tocExt = path.extname(outFile);
    const tocBase = outFile.slice(0, -tocExt.length);
    const tocFile = `${tocBase}_목차_${getNowTimestampStr()}${tocExt}`;
    await tocWb.xlsx.writeFile(tocFile);
    console.log(`[목차] 별도 엑셀 파일 생성: ${tocFile}`);
  }

  await workbook.xlsx.writeFile(outFile);
  console.log(`\n\n[${outFile}] Excel file created `);
  console.log('-------------------------------------------------------------------------------\n\n');
  await pool.close();
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
} 