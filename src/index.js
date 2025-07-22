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
  const sheets = parsed.queries.sheet.map(s => ({
    name: s.$.name,
    query: (s._ || (s["_"] ? s["_"] : (s["$"] ? s["$"] : '')) || (s["__cdata"] ? s["__cdata"] : '') || (s["cdata"] ? s["cdata"] : '') || (s["#cdata-section"] ? s["#cdata-section"] : '') || (s["__text"] ? s["__text"] : '') || (s["#text"] ? s["#text"] : '') || (s["$text"] ? s["$text"] : '') || (s["$value"] ? s["$value"] : '') || (s["value"] ? s["value"] : '') || '').toString().trim()
  }));
  return { globalVars, sheets };
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

async function main() {
  printAvailableXmlFiles();

  const argv = yargs
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: 'resources/queries.json' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: 'resources/query-define.xml' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'resources/config.json' })
    .option('out', { alias: 'o', describe: '엑셀 출력 파일명', default: 'output.xlsx' })
    .option('var', { alias: 'v', describe: '쿼리 변수 (key=value)', array: true, default: [] })
    .help().argv;

  // CLI 변수 파싱
  const cliVars = {};
  for (const v of argv.var) {
    const [key, value] = v.split('=');
    cliVars[key] = value;
  }

  let sheets, globalVars = {};
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    const xmlResult = await loadQueriesFromXML(resolvePath(argv.xml));
    globalVars = xmlResult.globalVars;
    sheets = xmlResult.sheets;
  } else if (argv.query && fs.existsSync(resolvePath(argv.query))) {
    const queries = JSON5.parse(fs.readFileSync(resolvePath(argv.query), 'utf8'));
    globalVars = queries.vars || {};
    sheets = queries.sheets;
  } else {
    throw new Error('쿼리 정의 파일을 찾을 수 없습니다. --query 또는 --xml 옵션을 확인하세요.');
  }

  // CLI 변수 > 파일 전역변수 우선 적용
  const mergedVars = { ...globalVars, ...cliVars };

  // DB 접속 정보 로드
  const configPath = resolvePath(argv.config);
  if (!fs.existsSync(configPath)) {
    throw new Error(`DB 접속 정보 파일이 존재하지 않습니다: ${configPath}`);
  }
  const dbConfig = JSON5.parse(fs.readFileSync(configPath, 'utf8'));
  const pool = new mssql.ConnectionPool(dbConfig);
  await pool.connect();

  console.log('-------------------------------------------------------------------------------');
  console.log(`[${argv.out}] START WORK`);
  console.log('-------------------------------------------------------------------------------');
  const workbook = new ExcelJS.Workbook();

  for (const sheetDef of sheets) {

    const sql = substituteVars(sheetDef.query, mergedVars);
    console.log(`[INFO] Executing for sheet '${sheetDef.name}'`);
    
    try {
      
      const result = await pool.request().query(sql);
      const sheet = workbook.addWorksheet(sheetDef.name);
      if (result.recordset.length > 0) {
        sheet.columns = Object.keys(result.recordset[0]).map(key => ({ header: key, key }));
        sheet.addRows(result.recordset);
      }
      console.log(`\t---> ${result.recordset.length} rows were selected `);
      
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(`${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
    
  }
  
  await workbook.xlsx.writeFile(argv.out);
  console.log(`\n\n[${argv.out}] Excel file created `);
  console.log('-------------------------------------------------------------------------------\n\n');
  await pool.close();
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
} 