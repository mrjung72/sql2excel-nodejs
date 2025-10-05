const yargs = require('yargs');
const JSON5 = require('json5');
const FileUtils = require('./file-utils');
const VariableProcessor = require('./variable-processor');
const StyleManager = require('./style-manager');
const QueryParser = require('./query-parser');
const ExcelGenerator = require('./excel-generator');
const MSSQLHelper = require('./mssql-helper');

// 모듈 인스턴스 생성
const fileUtils = new FileUtils();
const variableProcessor = new VariableProcessor();
const styleManager = new StyleManager();
const queryParser = new QueryParser();
const excelGenerator = new ExcelGenerator();

async function main() {
  const argv = yargs
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: '' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: '' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'config/dbinfo.json' })
    .option('var', { alias: 'v', describe: '쿼리 변수 (key=value)', array: true, default: [] })
    .option('style', { alias: 's', describe: '엑셀 스타일 템플릿 ID', default: 'default' })
    .option('list-styles', { describe: '사용 가능한 스타일 템플릿 목록 출력', boolean: true })
    .help().argv;

  FileUtils.printAvailableXmlFiles();

  // 스타일 목록 출력 옵션 처리
  if (argv['list-styles']) {
    await styleManager.listAvailableStyles();
    return;
  }

  // CLI 변수 파싱
  const cliVars = queryParser.parseCLIVariables(argv.var);

  let sheets, globalVars = {}, dbId, outputPath, queryDefs = {}, dynamicVars = [];
  
  // 쿼리 파일 로드
  if (argv.xml && FileUtils.exists(FileUtils.resolvePath(argv.xml))) {
    // 파일명 검증
    queryParser.validateQueryFile(argv.xml);
    const xmlResult = await queryParser.loadQueriesFromXML(FileUtils.resolvePath(argv.xml));
    globalVars = xmlResult.globalVars;
    sheets = xmlResult.sheets;
    dbId = xmlResult.dbId;
    outputPath = xmlResult.outputPath;
    queryDefs = xmlResult.queryDefs || {};
    dynamicVars = xmlResult.dynamicVars || [];
  } else if (argv.query && FileUtils.exists(FileUtils.resolvePath(argv.query))) {
    // 파일명 검증
    queryParser.validateQueryFile(argv.query);
    const jsonResult = queryParser.loadQueriesFromJSON(FileUtils.resolvePath(argv.query));
    globalVars = jsonResult.globalVars;
    sheets = jsonResult.sheets;
    dbId = jsonResult.dbId;
    outputPath = jsonResult.outputPath;
    queryDefs = jsonResult.queryDefs || {};
    dynamicVars = jsonResult.dynamicVars || [];
  } else {
    throw new Error('쿼리 정의 파일을 찾을 수 없습니다. --query 또는 --xml 옵션을 확인하세요.');
  }

  // CLI 변수 > 파일 전역변수 우선 적용
  const mergedVars = { ...globalVars, ...cliVars };

  // 기본값 설정
  let excelStyle = {};
  let excelDb = undefined;
  let excelOutput = undefined;
  let globalMaxRows = null; // 전역 최대 조회 건수
  let globalAggregateInfoTemplate = null; // 전역 집계 정보 템플릿
  
  // 기본 스타일 템플릿 적용 (CLI 옵션)
  const selectedStyle = await styleManager.getStyleById(argv.style);
  if (selectedStyle) {
    console.log(`🎨 CLI에서 지정된 스타일: ${selectedStyle.name} (${selectedStyle.description})`);
    excelStyle = {
      header: selectedStyle.header || {},
      body: selectedStyle.body || {}
    };
  } else {
    console.warn(`⚠️  CLI에서 지정된 스타일 템플릿을 찾을 수 없습니다: ${argv.style}`);
    console.warn(`   💡 기본 스타일을 사용합니다.`);
  }
  
  // 엑셀 설정 파싱
  if (argv.xml && FileUtils.exists(FileUtils.resolvePath(argv.xml))) {
    const xml = FileUtils.readFileSafely(FileUtils.resolvePath(argv.xml), 'utf8');
    const parsed = await require('xml2js').parseStringPromise(xml, { trim: true });
    const excelSettings = queryParser.parseExcelSettingsFromXML(parsed);
    
    globalMaxRows = excelSettings.maxRows;
    globalAggregateInfoTemplate = excelSettings.aggregateInfoTemplate;
    excelDb = excelSettings.db;
    excelOutput = excelSettings.output;
    
    if (globalAggregateInfoTemplate) {
      console.log(`📋 전역 집계 정보 템플릿: "${globalAggregateInfoTemplate}"`);
    }
    
    if (excelSettings.style) {
      const xmlStyle = await styleManager.getStyleById(excelSettings.style);
      if (xmlStyle) {
        console.log(`🎨 XML에서 지정된 스타일: ${xmlStyle.name} (${xmlStyle.description})`);
        excelStyle = {
          header: xmlStyle.header || {},
          body: xmlStyle.body || {}
        };
      } else {
        console.warn(`⚠️  XML에서 지정된 스타일을 찾을 수 없습니다: ${excelSettings.style}`);
      }
    }
  } else if (argv.query && FileUtils.exists(FileUtils.resolvePath(argv.query))) {
    const queries = JSON5.parse(FileUtils.readFileSafely(FileUtils.resolvePath(argv.query), 'utf8'));
    const excelSettings = queryParser.parseExcelSettingsFromJSON(queries);
    
    globalMaxRows = excelSettings.maxRows;
    globalAggregateInfoTemplate = excelSettings.aggregateInfoTemplate;
    excelDb = excelSettings.db;
    excelOutput = excelSettings.output;
    
    if (globalAggregateInfoTemplate) {
      console.log(`📋 전역 집계 정보 템플릿: "${globalAggregateInfoTemplate}"`);
    }
    
    if (queries.excel) {
      excelStyle = queries.excel;
    }
  }

  // DB 접속 정보 로드 (멀티 DB 지원)
  const configPath = FileUtils.resolvePath(argv.config);
  if (!FileUtils.exists(configPath)) {
    throw new Error(`DB 접속 정보 파일이 존재하지 않습니다: ${configPath}`);
  }
  const configObj = JSON5.parse(FileUtils.readFileSafely(configPath, 'utf8'));
  
  // MSSQL 헬퍼 인스턴스 생성
  const mssqlHelper = new MSSQLHelper();
  
  // 연결 설정 검증
  for (const [dbKey, config] of Object.entries(configObj.dbs || {})) {
    if (!mssqlHelper.validateConnectionConfig(config)) {
      throw new Error(`DB 연결 설정이 올바르지 않습니다: ${dbKey} (필수 필드: server, database, user, password)`);
    }
  }
  
  // 기본 DB 연결 설정
  const defaultDbKey = argv.db || dbId || excelDb;
  if (!configObj.dbs || !configObj.dbs[defaultDbKey]) {
    throw new Error(`기본 DB 접속 ID를 찾을 수 없습니다: ${defaultDbKey}`);
  }
  
  // DB 연결 풀 생성 함수
  async function getDbPool(dbKey) {
    return await mssqlHelper.createConnectionPool(configObj.dbs[dbKey], dbKey);
  }
  
  // 기본 DB 연결
  const defaultPool = await getDbPool(defaultDbKey);

  // 동적 변수 처리 (DB 연결 후, 시트 처리 전)
  if (dynamicVars && dynamicVars.length > 0) {
    await variableProcessor.processDynamicVariables(dynamicVars, mssqlHelper, defaultDbKey, mergedVars, configObj);
  }

  // 엑셀 파일 경로 결정 (CLI > excel > 쿼리파일 > 기본값)
  let outFile = argv.out || excelOutput || outputPath || 'output.xlsx';
  outFile = FileUtils.resolvePath(outFile);
  // 파일명에 _yyyymmddhhmmss 추가
  outFile = excelGenerator.generateOutputPath(outFile, FileUtils.getNowTimestampStr());
  FileUtils.ensureDirExists(outFile);

  const createdSheetNames = [];
  const createdSheetCounts = [];
  const processedSheets = [];

  // 시트 처리
  for (const sheetDef of sheets) {
    // robust use 속성 체크
    if (!styleManager.isSheetEnabled(sheetDef)) {
      console.log(`[SKIP] Sheet '${sheetDef.name}' is disabled (use=false)`);
      continue;
    }
    
    let sql = variableProcessor.substituteVars(sheetDef.query, mergedVars, sheetDef.params || {});
    const sheetName = variableProcessor.substituteVars(sheetDef.name, mergedVars, sheetDef.params || {});
    
    // maxRows 제한 적용 (개별 시트 설정 > 전역 설정 우선)
    const effectiveMaxRows = sheetDef.maxRows || globalMaxRows;
    if (effectiveMaxRows && effectiveMaxRows > 0) {
      // MSSQL 헬퍼를 사용하여 TOP 절 추가
      const originalSql = sql;
      sql = mssqlHelper.addTopClause(sql, effectiveMaxRows);
      
      if (originalSql !== sql) {
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
      const result = await mssqlHelper.executeQuery(currentPool, sql);
      const recordCount = result.recordset.length;
      
      // 시트별 스타일 적용 (우선순위: 시트별 > XML 전역 > CLI > 기본)
      let sheetStyle = excelStyle; // 기본값은 전역 스타일
      
      if (sheetDef.style) {
        const sheetStyleTemplate = await styleManager.getStyleById(sheetDef.style);
        if (sheetStyleTemplate) {
          console.log(`\t🎨 시트별 스타일 적용: ${sheetStyleTemplate.name} (${sheetStyleTemplate.description})`);
          sheetStyle = {
            header: sheetStyleTemplate.header || {},
            body: sheetStyleTemplate.body || {}
          };
        } else {
          console.warn(`\t⚠️  시트별 스타일을 찾을 수 없습니다: ${sheetDef.style}`);
          console.warn(`\t   💡 전역 스타일을 사용합니다.`);
        }
      } else {
        console.log(`\t🎨 전역 스타일 적용: ${excelStyle.header?.font?.name || '기본'} 스타일`);
      }
      
      // 집계 데이터 계산
      let aggregateData = null;
      if (sheetDef.aggregateColumn && recordCount > 0) {
        aggregateData = excelGenerator.calculateAggregateData(sheetDef.aggregateColumn, result.recordset);
        if (aggregateData && aggregateData.length > 0) {
          console.log(`\t[집계] ${sheetDef.aggregateColumn} 컬럼 집계: ${aggregateData.map(item => `${item.key}(${item.count})`).join(', ')}`);
        }
      }
      
      createdSheetNames.push({ 
        displayName: sheetName, 
        originalName: sheetName,
        tabName: sheetName, 
        recordCount: recordCount,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateInfoTemplate: sheetDef.aggregateInfoTemplate || globalAggregateInfoTemplate, // 시트별 > 전역 템플릿 우선
        aggregateData: aggregateData
      });
      createdSheetCounts.push(recordCount);
      
      // 처리된 시트 정보 저장
      processedSheets.push({
        name: sheetName,
        data: result.recordset,
        style: sheetStyle,
        recordCount: recordCount,
        dbKey: sheetDbKey,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateInfoTemplate: sheetDef.aggregateInfoTemplate || globalAggregateInfoTemplate, // 시트별 > 전역 템플릿 우선
        aggregateData: aggregateData, // 집계 데이터 추가
        query: sql
      });
      
      console.log(`\t---> ${recordCount} rows were selected `);
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(mssqlHelper.formatErrorMessage(error));
      console.log(`\n\nSQL: ${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
  }
  
  // 엑셀 파일 생성
  if (processedSheets.length > 0) {
    await excelGenerator.generateExcel({
      sheets: processedSheets,
      outputPath: outFile,
      createdSheetNames: createdSheetNames,
      createdSheetCounts: createdSheetCounts
    });
  }
  
  // 모든 DB 연결 정리
  await mssqlHelper.closeAllConnections();
}

// 모듈로 사용될 때를 위해 main 함수를 export
module.exports = { main };

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}