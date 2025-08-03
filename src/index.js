const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const ExcelJS = require('exceljs');
const yargs = require('yargs');
const JSON5 = require('json5');
const xml2js = require('xml2js');
const excelStyleHelper = require('./excel-style-helper');

function substituteVars(str, vars) {
  return str.replace(/\$\{(\w+)\}/g, (_, v) => {
    const value = vars[v];
    if (value === undefined || value === null) return '';
    
    // 배열 타입인 경우 IN절 처리
    if (Array.isArray(value)) {
      // 문자열 배열인 경우 따옴표로 감싸기
      const inClause = value.map(val => {
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`; // SQL 인젝션 방지를 위한 따옴표 이스케이핑
        }
        return val;
      }).join(', ');
      return inClause;
    } else {
      // 기존 방식: 단일 값 치환
      return value;
    }
  });
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
        let value = v._.toString();
        // 배열 형태 문자열을 실제 배열로 변환
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // JSON 파싱 실패 시 문자열 그대로 사용
          }
        }
        // boolean 값 처리
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        // 숫자 값 처리
        if (!isNaN(value) && !isNaN(parseFloat(value)) && typeof value === 'string') {
          value = parseFloat(value);
        }
        globalVars[v.$.name] = value;
      } else if (v.$ && v.$.name && typeof v === 'string') {
        let value = v;
        // 배열 형태 문자열을 실제 배열로 변환
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // JSON 파싱 실패 시 문자열 그대로 사용
          }
        }
        globalVars[v.$.name] = value;
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
    use: s.$.use,
    aggregateColumn: s.$.aggregateColumn || null,
    maxRows: s.$.maxRows ? parseInt(s.$.maxRows) : null,
    db: s.$.db || null,
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
  const dir = path.join(process.cwd(), 'queries');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml'));
  if (files.length > 0) {
    console.log('-------------------------------------------------------------------------------');
    console.log('[INFO] 사용 가능한 XML 쿼리 정의 파일 목록:');
    console.log('-------------------------------------------------------------------------------');
    files.forEach(f => console.log('  - queries/' + f));
    console.log('-------------------------------------------------------------------------------');

  } else {
    console.log('[INFO] queries 폴더에 XML 쿼리 정의 파일이 없습니다.');
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
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: '' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: '' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'config/dbinfo.json' })
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

  // 기본값 설정
  let excelStyle = {};
  let excelDb = undefined;
  let excelOutput = undefined;
  let createSeparateToc = false; // 별도 목차 파일 생성 여부
  let globalMaxRows = null; // 전역 최대 조회 건수
  
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    const xml = fs.readFileSync(resolvePath(argv.xml), 'utf8');
    const parsed = await xml2js.parseStringPromise(xml, { trim: true });
    
    // queries 루트 엘리먼트에서 separateToc 속성 확인
    if (parsed.queries && parsed.queries.$) {
      if (parsed.queries.$.separateToc) createSeparateToc = parsed.queries.$.separateToc === 'true';
    }
    
    if (parsed.queries && parsed.queries.excel && parsed.queries.excel[0]) {
      const excel = parsed.queries.excel[0];
      if (excel.$ && excel.$.db) excelDb = excel.$.db;
      if (excel.$ && excel.$.output) excelOutput = excel.$.output;
      // excel 엘리먼트의 separateToc가 있으면 우선적용 (덮어쓰기)
      if (excel.$ && excel.$.separateToc) createSeparateToc = excel.$.separateToc === 'true';
      // excel 엘리먼트의 maxRows 읽기
      if (excel.$ && excel.$.maxRows) globalMaxRows = parseInt(excel.$.maxRows);
      
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
      if (queries.excel.separateToc !== undefined) createSeparateToc = queries.excel.separateToc;
      if (queries.excel.maxRows !== undefined) globalMaxRows = parseInt(queries.excel.maxRows);
    }
  }

  // DB 접속 정보 로드 (멀티 DB 지원)
  const configPath = resolvePath(argv.config);
  if (!fs.existsSync(configPath)) {
    throw new Error(`DB 접속 정보 파일이 존재하지 않습니다: ${configPath}`);
  }
  const configObj = JSON5.parse(fs.readFileSync(configPath, 'utf8'));
  
  // 다중 DB 연결 관리 객체
  const dbPools = {};
  
  // 기본 DB 연결 설정
  const defaultDbKey = argv.db || dbId || excelDb;
  if (!configObj.dbs || !configObj.dbs[defaultDbKey]) {
    throw new Error(`기본 DB 접속 ID를 찾을 수 없습니다: ${defaultDbKey}`);
  }
  
  // DB 연결 풀 생성 함수
  async function getDbPool(dbKey) {
    if (!dbPools[dbKey]) {
      if (!configObj.dbs[dbKey]) {
    throw new Error(`DB 접속 ID를 찾을 수 없습니다: ${dbKey}`);
  }
      console.log(`[DB] ${dbKey} 데이터베이스에 연결 중...`);
      const pool = new mssql.ConnectionPool(configObj.dbs[dbKey]);
  await pool.connect();
      dbPools[dbKey] = pool;
      console.log(`[DB] ${dbKey} 데이터베이스 연결 완료`);
    }
    return dbPools[dbKey];
  }
  
  // 기본 DB 연결
  const defaultPool = await getDbPool(defaultDbKey);

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
  const createdSheetCounts = [];

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
    
    let sql = substituteVars(sheetDef.query, mergedVars);
    const sheetName = substituteVars(sheetDef.name, mergedVars);
    
    // maxRows 제한 적용 (개별 시트 설정 > 전역 설정 우선)
    const effectiveMaxRows = sheetDef.maxRows || globalMaxRows;
    if (effectiveMaxRows && effectiveMaxRows > 0) {
      // SQL에 TOP 절이 없는 경우에만 추가
      if (!sql.trim().toUpperCase().includes('TOP ')) {
        // SELECT 다음에 TOP N을 삽입
        sql = sql.replace(/^\s*SELECT\s+/i, `SELECT TOP ${effectiveMaxRows} `);
        const source = sheetDef.maxRows ? '시트별' : '전역';
        console.log(`\t[제한] 최대 ${effectiveMaxRows}건으로 제한됨 (${source} 설정)`);
      } else {
        console.log(`\t[제한] 쿼리에 이미 TOP 절이 존재하여 maxRows 설정 무시됨`);
      }
    }
    
    // 시트별 DB 연결 결정 (개별 시트 설정 > 기본 DB 설정 우선)
    const sheetDbKey = sheetDef.db || defaultDbKey;
    const currentPool = await getDbPool(sheetDbKey);
    
    console.log(`[INFO] Executing for sheet '${sheetName}' on DB '${sheetDbKey}'`);
    try {
      const result = await currentPool.request().query(sql);
      const sheet = workbook.addWorksheet(sheetName);
      const recordCount = result.recordset.length;
      
      // 실제 생성된 시트명 가져오기 (31자 초과시 잘린 이름)
      const actualSheetName = sheet.name;
      
      // 집계 컬럼이 지정된 경우 집계 데이터 계산
      let aggregateData = null;
      if (sheetDef.aggregateColumn && recordCount > 0) {
        const aggregateColumn = sheetDef.aggregateColumn;
        const aggregateMap = {};
        
        result.recordset.forEach(row => {
          const value = row[aggregateColumn];
          if (value !== null && value !== undefined) {
            const key = String(value).trim();
            aggregateMap[key] = (aggregateMap[key] || 0) + 1;
          }
        });
        
        // 집계 결과를 배열로 변환 (건수가 많은 순으로 정렬)
        aggregateData = Object.entries(aggregateMap)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count);
          
        console.log(`\t[집계] ${aggregateColumn} 컬럼 집계: ${aggregateData.map(item => `${item.key}(${item.count})`).join(', ')}`);
      }
      
      createdSheetNames.push({ 
        displayName: sheetName, 
        originalName: sheetName,
        tabName: actualSheetName, 
        recordCount: recordCount,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateData: aggregateData
      });
      createdSheetCounts.push(recordCount);
      
      // 시트명이 잘렸는지 확인하고 로그 출력
      if (sheetName !== actualSheetName) {
        console.log(`\t[WARN] Sheet name truncated: '${sheetName}' → '${actualSheetName}'`);
      }
      
      if (recordCount > 0) {
        // 데이터와 스타일 적용 (1행부터 시작)
        excelStyleHelper.applySheetStyle(sheet, result.recordset, excelStyle, 1);
        
        // 데이터 추가 후 맨 앞에 DB 정보 행 삽입
        sheet.spliceRows(1, 0, [`📊 출처: ${sheetDbKey} DB`]);
        sheet.spliceRows(2, 0, []);  // 빈 행 추가
        
        // DB 정보 셀 스타일링
        const dbCell = sheet.getCell('A1');
        dbCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        dbCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        
        console.log(`\t[DB정보] ${sheetDbKey} DB 출처 표시 완료`);
      } else {
        // 데이터가 없는 경우
        sheet.addRow([`📊 출처: ${sheetDbKey} DB`]);
        sheet.addRow([]);
        sheet.addRow(['데이터가 없습니다.']);
        
        // 스타일링
        sheet.getCell('A1').font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        sheet.getCell('A3').font = { italic: true, color: { argb: '999999' } };
        
        console.log(`\t[DB정보] ${sheetDbKey} DB 출처 표시 완료 (데이터 없음)`);
      }
      console.log(`\t---> ${recordCount} rows were selected `);
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(error);
      console.log(`\n\nSQL: ${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
  }
  
  // 목차 시트에 내용 채우기
  if (createdSheetNames.length > 0 && tocSheet) {
    // excel-style-helper 모듈의 함수 사용하여 안전한 목차 생성
    excelStyleHelper.populateTableOfContents(tocSheet, createdSheetNames);
    
    // 목차 시트를 첫 번째로 이동
    workbook.worksheets = [tocSheet, ...workbook.worksheets.filter(ws => ws.name !== '목차')];
    
    console.log(`[목차] 내용 채우기 완료 (총 ${createdSheetNames.length}개 시트)`);

    if (createSeparateToc) {
    // 별도 목차 엑셀 파일 생성
    const tocWb = new ExcelJS.Workbook();
    const tocOnly = tocWb.addWorksheet('목차');
    tocOnly.addRow(['No', 'Sheet Name', 'Data Count']);
    createdSheetNames.forEach((obj, idx) => {
      const row = tocOnly.addRow([idx + 1, obj.displayName, createdSheetCounts[idx]]);
      row.getCell(2).font = { color: { argb: '0563C1' }, underline: true };
      row.getCell(3).font = { color: { argb: '0563C1' }, underline: true };
    });
    tocOnly.getRow(1).font = { bold: true };
    tocOnly.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Sheet Name', key: 'name', width: 30 },
      { header: 'Data Count', key: 'count', width: 12 }
    ];
    const tocExt = path.extname(outFile);
    const tocBase = outFile.slice(0, -tocExt.length);
    const tocFile = `${tocBase}_목차_${getNowTimestampStr()}${tocExt}`;
    await tocWb.xlsx.writeFile(tocFile);
    console.log(`[목차] 별도 엑셀 파일 생성: ${tocFile}`);
    }

  }
  console.log(`\nGenerating excel file ... `);
  console.log(`Wating a few seconds ... `);
  await workbook.xlsx.writeFile(outFile);
  console.log(`\n\n[${outFile}] Excel file created `);
  console.log('-------------------------------------------------------------------------------\n\n');
  
  // 모든 DB 연결 정리
  for (const [dbKey, pool] of Object.entries(dbPools)) {
    console.log(`[DB] ${dbKey} 데이터베이스 연결 종료`);
  await pool.close();
  }
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}