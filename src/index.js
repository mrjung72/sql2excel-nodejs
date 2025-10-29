const yargs = require('yargs/yargs');
const JSON5 = require('json5');
const FileUtils = require('./file-utils');
const VariableProcessor = require('./variable-processor');
const StyleManager = require('./style-manager');
const QueryParser = require('./query-parser');
const ExcelGenerator = require('./excel-generator');
const DatabaseFactory = require('./database/DatabaseFactory');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        queryFileNotFound: 'Query definition file not found. Check --query or --xml option.',
        cliStyle: '🎨 CLI specified style:',
        cliStyleNotFound: '⚠️  CLI specified style template not found:',
        cliStyleUsingDefault: '   💡 Using default style.',
        globalAggregateTemplate: '📋 Global aggregate info template:',
        xmlStyle: '🎨 XML specified style:',
        xmlStyleNotFound: '⚠️  XML specified style not found:',
        dbConfigNotFound: 'DB connection info file does not exist:',
        dbConfigInvalid: 'DB connection config is invalid:',
        requiredFields: '(required fields: server, database, user, password)',
        defaultDbNotFound: 'Default DB connection ID not found:',
        skipSheet: '[SKIP] Sheet',
        isDisabled: 'is disabled (use=false)',
        sheetNameAutoFix: '\n⚠️  Sheet name auto-fixed (Sheet',
        originalSheetName: '   Original sheet name:',
        modifiedSheetName: '   Modified sheet name:',
        maxRowsLimit: '\t[Limit] Limited to maximum',
        maxRowsLimitSrc: 'rows (source:',
        maxRowsLimitSheet: 'sheet',
        maxRowsLimitGlobal: 'global',
        maxRowsLimitSetting: 'setting)',
        maxRowsIgnored: '\t[Limit] maxRows setting ignored because query already has TOP clause',
        infoExecuting: '[INFO] Executing for sheet',
        onDb: 'on DB',
        sheetStyle: '\t🎨 Sheet-specific style applied:',
        sheetStyleNotFound: '\t⚠️  Sheet-specific style not found:',
        sheetStyleUsingGlobal: '\t   💡 Using global style.',
        globalStyleApplied: '\t🎨 Global style applied:',
        defaultStyle: 'default',
        style: 'style',
        aggregate: '\t[Aggregate]',
        columnAggregate: 'column aggregate:',
        rowsSelected: 'rows were selected',
        errorHeader: '----------------------------------[ERROR]--------------------------------------\n',
        sql: '\n\nSQL:',
        errorFooter: '\n-------------------------------------------------------------------------------'
    },
    kr: {
        queryFileNotFound: '쿼리 정의 파일을 찾을 수 없습니다. --query 또는 --xml 옵션을 확인하세요.',
        cliStyle: '🎨 CLI에서 지정된 스타일:',
        cliStyleNotFound: '⚠️  CLI에서 지정된 스타일 템플릿을 찾을 수 없습니다:',
        cliStyleUsingDefault: '   💡 기본 스타일을 사용합니다.',
        globalAggregateTemplate: '📋 전역 집계 정보 템플릿:',
        xmlStyle: '🎨 XML에서 지정된 스타일:',
        xmlStyleNotFound: '⚠️  XML에서 지정된 스타일을 찾을 수 없습니다:',
        dbConfigNotFound: 'DB 접속 정보 파일이 존재하지 않습니다:',
        dbConfigInvalid: 'DB 연결 설정이 올바르지 않습니다:',
        requiredFields: '(필수 필드: server, database, user, password)',
        defaultDbNotFound: '기본 DB 접속 ID를 찾을 수 없습니다:',
        skipSheet: '[SKIP] 시트',
        isDisabled: '비활성화됨 (use=false)',
        sheetNameAutoFix: '\n⚠️  시트명 자동 수정 (시트',
        originalSheetName: '   원래 시트명:',
        modifiedSheetName: '   수정된 시트명:',
        maxRowsLimit: '\t[제한] 최대',
        maxRowsLimitSrc: '건으로 제한됨 (',
        maxRowsLimitSheet: '시트별',
        maxRowsLimitGlobal: '전역',
        maxRowsLimitSetting: '설정)',
        maxRowsIgnored: '\t[제한] 쿼리에 이미 TOP 절이 존재하여 maxRows 설정 무시됨',
        infoExecuting: '[INFO] 시트',
        onDb: '실행 중, DB:',
        sheetStyle: '\t🎨 시트별 스타일 적용:',
        sheetStyleNotFound: '\t⚠️  시트별 스타일을 찾을 수 없습니다:',
        sheetStyleUsingGlobal: '\t   💡 전역 스타일을 사용합니다.',
        globalStyleApplied: '\t🎨 전역 스타일 적용:',
        defaultStyle: '기본',
        style: '스타일',
        aggregate: '\t[집계]',
        columnAggregate: '컬럼 집계:',
        rowsSelected: '행이 선택됨',
        errorHeader: '----------------------------------[오류]--------------------------------------\n',
        sql: '\n\nSQL:',
        errorFooter: '\n-------------------------------------------------------------------------------'
    }
};

const msg = messages[LANGUAGE] || messages.en;

// 모듈 인스턴스 생성
const fileUtils = new FileUtils();
const variableProcessor = new VariableProcessor();
const styleManager = new StyleManager();
const queryParser = new QueryParser();
const excelGenerator = new ExcelGenerator();

async function main() {
  // yargs를 매번 새로 생성하여 process.argv를 명시적으로 전달
  const argv = yargs(process.argv.slice(2))
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: '' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: '' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'config/dbinfo.json' })
    .option('var', { alias: 'v', describe: '쿼리 변수 (key=value)', array: true, default: [] })
    .option('style', { alias: 's', describe: '엑셀 스타일 템플릿 ID', default: 'default' })
    .option('list-styles', { describe: '사용 가능한 스타일 템플릿 목록 출력', boolean: true })
    .help().argv;

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
    const xmlResult = await queryParser.loadQueriesFromXML(FileUtils.resolvePath(argv.xml));
    globalVars = xmlResult.globalVars;
    sheets = xmlResult.sheets;
    dbId = xmlResult.dbId;
    outputPath = xmlResult.outputPath;
    queryDefs = xmlResult.queryDefs || {};
    dynamicVars = xmlResult.dynamicVars || [];
  } else if (argv.query && FileUtils.exists(FileUtils.resolvePath(argv.query))) {
    const jsonResult = queryParser.loadQueriesFromJSON(FileUtils.resolvePath(argv.query));
    globalVars = jsonResult.globalVars;
    sheets = jsonResult.sheets;
    dbId = jsonResult.dbId;
    outputPath = jsonResult.outputPath;
    queryDefs = jsonResult.queryDefs || {};
    dynamicVars = jsonResult.dynamicVars || [];
  } else {
    throw new Error(msg.queryFileNotFound);
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
    console.log(`${msg.cliStyle} ${selectedStyle.name} (${selectedStyle.description})`);
    excelStyle = {
      header: selectedStyle.header || {},
      body: selectedStyle.body || {}
    };
  } else {
    console.warn(`${msg.cliStyleNotFound} ${argv.style}`);
    console.warn(msg.cliStyleUsingDefault);
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
      console.log(`${msg.globalAggregateTemplate} "${globalAggregateInfoTemplate}"`);
    }
    
    if (excelSettings.style) {
      const xmlStyle = await styleManager.getStyleById(excelSettings.style);
      if (xmlStyle) {
        console.log(`${msg.xmlStyle} ${xmlStyle.name} (${xmlStyle.description})`);
        excelStyle = {
          header: xmlStyle.header || {},
          body: xmlStyle.body || {}
        };
      } else {
        console.warn(`${msg.xmlStyleNotFound} ${excelSettings.style}`);
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
      console.log(`${msg.globalAggregateTemplate} "${globalAggregateInfoTemplate}"`);
    }
    
    if (queries.excel) {
      excelStyle = queries.excel;
    }
  }

  // DB 접속 정보 로드 (멀티 DB 지원)
  const configPath = FileUtils.resolvePath(argv.config);
  if (!FileUtils.exists(configPath)) {
    throw new Error(`${msg.dbConfigNotFound} ${configPath}`);
  }
  const configObj = JSON5.parse(FileUtils.readFileSafely(configPath, 'utf8'));
  
  // DB 어댑터 맵 (각 DB별로 적절한 어댑터 생성)
  const dbAdapters = {};
  
  // 연결 설정 검증 및 어댑터 생성
  for (const [dbKey, config] of Object.entries(configObj || {})) {
    // type이 없으면 기본값 'mssql' 사용 (하위 호환성)
    const dbType = config.type || 'mssql';
    
    // 어댑터 생성
    const adapter = DatabaseFactory.createAdapter(dbType, config, LANGUAGE);
    
    if (!adapter.validateConnectionConfig(config)) {
      throw new Error(`${msg.dbConfigInvalid} ${dbKey} ${msg.requiredFields}`);
    }
    
    dbAdapters[dbKey] = adapter;
  }
  
  // 기본 DB 연결 설정
  const defaultDbKey = argv.db || dbId || excelDb;
  if (!configObj || !configObj[defaultDbKey]) {
    throw new Error(`${msg.defaultDbNotFound} ${defaultDbKey}`);
  }
  
  // DB 연결 풀 생성 함수
  async function getDbPool(dbKey) {
    const adapter = dbAdapters[dbKey];
    return await adapter.createConnectionPool(configObj[dbKey], dbKey);
  }
  
  // 기본 DB 어댑터 가져오기
  const defaultAdapter = dbAdapters[defaultDbKey];
  
  // 기본 DB 연결
  const defaultPool = await getDbPool(defaultDbKey);

  // 동적 변수 처리 (DB 연결 후, 시트 처리 전)
  if (dynamicVars && dynamicVars.length > 0) {
    await variableProcessor.processDynamicVariables(dynamicVars, defaultAdapter, defaultDbKey, mergedVars, configObj);
  }

  // 엑셀 파일 경로 결정 (CLI > excel > 쿼리파일 > 기본값)
  let outFile = argv.out || excelOutput || outputPath || 'output.xlsx';
  // 파일명에 포함된 변수 치환 (예: ${DATE.KST:YYYYMMDD})
  outFile = variableProcessor.substituteVars(outFile, mergedVars);
  outFile = FileUtils.resolvePath(outFile);
  // 파일명에 _yyyymmddhhmmss 추가
  outFile = excelGenerator.generateOutputPath(outFile, FileUtils.getNowTimestampStr());
  FileUtils.ensureDirExists(outFile);

  const createdSheetNames = [];
  const createdSheetCounts = [];
  const processedSheets = [];

  // 시트 처리
  let sheetIndex = 0;
  for (const sheetDef of sheets) {
    // robust use 속성 체크
    if (!styleManager.isSheetEnabled(sheetDef)) {
      console.log(`${msg.skipSheet} '${sheetDef.name}' ${msg.isDisabled}`);
      continue;
    }
    
    let sql = variableProcessor.substituteVars(sheetDef.query, mergedVars, sheetDef.params || {});
    let sheetName = variableProcessor.substituteVars(sheetDef.name, mergedVars, sheetDef.params || {});
    const originalSheetNameCandidate = sheetName;
    
    // 시트명 자동 수정 (변수 치환 후)
    const sheetNameValidation = queryParser.validateSheetName(sheetName, sheetIndex);

    if (!sheetNameValidation.valid) {
      console.warn(`${msg.sheetNameAutoFix} #${sheetIndex + 1}):`);
      console.warn(`${msg.originalSheetName} "${sheetName}"`);

      // 허용되지 않는 문자 제거
      const invalidChars = ['\\', '/', '*', '?', '[', ']', ':'];
      invalidChars.forEach(char => {
        sheetName = sheetName.replace(new RegExp('\\' + char, 'g'), '_');
      });
      
      // 앞뒤 공백 제거
      sheetName = sheetName.trim();
      
      // 31자로 제한
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 31);
      }
      
      console.warn(`${msg.modifiedSheetName} "${sheetName}"`);
    }
    
    // maxRows 제한 적용 (개별 시트 설정 > 전역 설정 우선)
    const effectiveMaxRows = sheetDef.maxRows || globalMaxRows;
    if (effectiveMaxRows && effectiveMaxRows > 0) {
      // 시트별 DB 어댑터를 사용하여 TOP/LIMIT 절 추가
      const sheetDbKey = sheetDef.db || defaultDbKey;
      const sheetAdapter = dbAdapters[sheetDbKey];
      const originalSql = sql;
      sql = sheetAdapter.addTopClause(sql, effectiveMaxRows);
      
      if (originalSql !== sql) {
        const source = sheetDef.maxRows ? msg.maxRowsLimitSheet : msg.maxRowsLimitGlobal;
        console.log(`${msg.maxRowsLimit} ${effectiveMaxRows}${msg.maxRowsLimitSrc} ${source} ${msg.maxRowsLimitSetting}`);
      } else {
        console.log(msg.maxRowsIgnored);
      }
    }
    
    // 시트별 DB 연결 결정 (개별 시트 설정 > 기본 DB 설정 우선)
    const sheetDbKey = sheetDef.db || defaultDbKey;
    const currentAdapter = dbAdapters[sheetDbKey];
    const currentPool = await getDbPool(sheetDbKey);
    
    console.log(`${msg.infoExecuting} '${sheetName}' ${msg.onDb} '${sheetDbKey}'`);
    try {
      const result = await currentAdapter.executeQuery(currentPool, sql);
      const recordCount = result.recordset.length;
      
      // 시트별 스타일 적용 (우선순위: 시트별 > XML 전역 > CLI > 기본)
      let sheetStyle = excelStyle; // 기본값은 전역 스타일
      
      if (sheetDef.style) {
        const sheetStyleTemplate = await styleManager.getStyleById(sheetDef.style);
        if (sheetStyleTemplate) {
          console.log(`${msg.sheetStyle} ${sheetStyleTemplate.name} (${sheetStyleTemplate.description})`);
          sheetStyle = {
            header: sheetStyleTemplate.header || {},
            body: sheetStyleTemplate.body || {}
          };
        } else {
          console.warn(`${msg.sheetStyleNotFound} ${sheetDef.style}`);
          console.warn(msg.sheetStyleUsingGlobal);
        }
      } else {
        console.log(`${msg.globalStyleApplied} ${excelStyle.header?.font?.name || msg.defaultStyle} ${msg.style}`);
      }
      
      // 집계 데이터 계산
      let aggregateData = null;
      if (sheetDef.aggregateColumn && recordCount > 0) {
        aggregateData = excelGenerator.calculateAggregateData(sheetDef.aggregateColumn, result.recordset);
        if (aggregateData && aggregateData.length > 0) {
          console.log(`${msg.aggregate} ${sheetDef.aggregateColumn} ${msg.columnAggregate} ${aggregateData.map(item => `${item.key}(${item.count})`).join(', ')}`);
        }
      }
      
      createdSheetNames.push({ 
        displayName: sheetName, 
        originalName: originalSheetNameCandidate,
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
        originalName: originalSheetNameCandidate,
        data: result.recordset,
        style: sheetStyle,
        recordCount: recordCount,
        dbKey: sheetDbKey,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateInfoTemplate: sheetDef.aggregateInfoTemplate || globalAggregateInfoTemplate, // 시트별 > 전역 템플릿 우선
        aggregateData: aggregateData, // 집계 데이터 추가
        query: sql
      });
      
      console.log(`\t---> ${recordCount} ${msg.rowsSelected} `);
    } catch (error) {
      console.log(msg.errorHeader);
      console.log(currentAdapter.formatErrorMessage(error));
      console.log(`${msg.sql} ${sql}`);
      console.log(msg.errorFooter);
    }
    
    sheetIndex++;
  }
  
  // 파일 생성 (엑셀 또는 per-sheet 파일들)
  if (processedSheets.length > 0) {
    const ext = FileUtils.getExtension(outFile).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      await excelGenerator.generateExcel({
        sheets: processedSheets,
        outputPath: outFile,
        createdSheetNames: createdSheetNames,
        createdSheetCounts: createdSheetCounts
      });
    } else {
      const format = (ext === '.csv') ? 'csv' : 'txt';
      await excelGenerator.exportPerSheetFiles({
        sheets: processedSheets,
        outputPath: outFile,
        format
      });
    }
  }
  
  // 모든 DB 연결 정리
  for (const adapter of Object.values(dbAdapters)) {
    await adapter.closeAllConnections();
  }
}

// 모듈로 사용될 때를 위해 main 함수를 export
module.exports = { main };

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}