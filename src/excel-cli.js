const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const yargs = require('yargs');

// 언어 설정
const LANGUAGE = process.env.LANGUAGE || 'kr';

// 다국어 메시지
const messages = {
    en: {
        sheetNameEmpty: 'Sheet name is empty.',
        sheetNameTooLong: 'Sheet name is too long (max 31 characters, current: {length} characters)',
        sheetNameInvalidChars: 'Contains invalid characters: {chars}',
        sheetNameWhitespace: 'Sheet name has leading or trailing whitespace.',
        
        helpMessage: `
        SQL2Excel Tool v1.2
        Usage: node src/excel-cli.js <command> [options]

        Commands:
          export                     Export SQL query results to Excel file
          validate                   Validate query definition file
          list-dbs                   Show database list (with connection status)
          help                       Show help

        Options:
          --query, -q <path>         Query definition file path (JSON)
          --xml, -x <path>           Query definition file path (XML)
          --config, -c <path>        DB connection info file (default: config/dbinfo.json)
          --var, -v <key=value>      Query variable (key=value format, multiple allowed)

        Examples:
          node src/excel-cli.js export --xml ./queries/sample-queries.xml
          node src/excel-cli.js export --query ./queries/sample-queries.json
          node src/excel-cli.js validate --xml ./queries/sample-queries.xml
          node src/excel-cli.js list-dbs
          node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

        Environment Variables:
          Set database connection info in config/dbinfo.json file.`,
        
        configFileNotFound: 'Config file not found: {path}',
        configFileInvalid: 'Config file format is invalid.',
        configFileLoadFailed: 'Failed to load config file: {message}',
        
        dbConnecting: '  {dbKey}: Connecting...',
        dbConnectionSuccess: '  {dbKey}: ✅ Connection successful',
        dbConnectionFailed: '  {dbKey}: ❌ Connection failed - {message}',
        
        dbTestStarting: '📋 Starting database connection test\n',
        noDatabasesConfigured: '❌ No databases configured.',
        dbTestCount: 'Testing {count} database connections:\n',
        dbTestSummaryHeader: '📊 Connection Test Summary',
        dbTestTotalCount: 'Total databases: {count}',
        dbTestSuccessCount: 'Connection successful: {count}',
        dbTestFailureCount: 'Connection failed: {count}',
        dbTestFailedList: '\n❌ Failed database connections:',
        dbTestFailedItem: '  - {dbKey}: {message}',
        dbTestSuccessList: '\n✅ Successful database connections:',
        dbTestSuccessItem: '  - {dbKey}: {server}/{database}:{port}',
        dbTestFailed: '❌ Database connection test failed: {message}',
        
        queryValidationStarting: '📋 Starting query file validation\n',
        queryFilePathNotSpecified: 'Query file path not specified. Use --xml or --query option.',
        queryFilePath: 'File path: {path}',
        queryFileType: 'File type: {type}',
        queryFileNotFound: 'Query file not found: {path}',
        queryFileExists: '✅ File exists',
        xmlFormatInvalid: 'XML file format is invalid. queries and sheet elements are required.',
        xmlFormatValid: '✅ XML format valid',
        sheetCount: '   Sheet count: {count}',
        sheetListHeader: '\n📋 Sheet list and validation:',
        sheetValidSuccess: '   ✅ Sheet #{index}: "{name}"',
        sheetValidFailed: '   ❌ Sheet #{index}: "{name}"',
        sheetValidErrorItem: '      - {error}',
        sheetValidAutoFix: '      💡 Automatically corrected during execution.',
        queryDefCount: '\n📋 Query definition count: {count}',
        queryRefNotFound: '   ❌ Sheet "{sheetName}" references query definition "{queryRef}" which cannot be found.',
        queryRefValid: '   ✅ Sheet "{sheetName}" -> Query definition "{queryRef}" reference confirmed',
        validationFailed: '\n❌ Validation failed: Errors in sheet names or query references.',
        
        jsonFormatInvalid: 'JSON file format is invalid. sheets property is required.',
        jsonFormatValid: '✅ JSON format valid',
        
        dbConfigLoaded: '\n✅ Database configuration loaded',
        dbConfigCount: '   Configured DB count: {count}',
        dbUsageHeader: '\n📋 Databases used in this query file ({count}):',
        dbUsageItem: '   ✅ {dbId}:',
        dbUsageServer: '      Server: {server}',
        dbUsageDatabase: '      Database: {database}',
        dbUsageUser: '      User: {user}',
        dbUsageWritable: '      Write permission: {writable}',
        dbUsageDescription: '      Description: {description}',
        dbUsageNotFound: '   ❌ {dbId}: Not found in config file.',
        dbUsageNone: '\n📋 Database usage info:',
        dbUsageNoneInfo: '   ℹ️  No explicitly specified DB in query file.',
        dbUsageNoneDefault: '   💡 Default DB will be used.',
        dbNotFoundInConfig: '\n❌ Validation failed: Some DBs not found in config file.',
        
        allValidationComplete: '\n✅ All validation completed.',
        queryValidationFailed: '❌ Query file validation failed: {message}',
        
        toolHeader: '🔍 SQL2Excel Tool',
        jsonQueryFile: '📁 JSON query file: {path}',
        xmlQueryFile: '📁 XML query file: {path}',
        dbConfigFile: '📁 DB config file: {path}',
        variables: '📊 Variables: {vars}',
        
        exportStarting: 'Starting Excel export...\n',
        exportFailed: 'Error occurred during Excel export: {message}',
        
        queryValidating: 'Validating query file...\n',
        queryFileValid: '✅ Query file is valid.',
        queryFileInvalid: '❌ Query file validation failed.',
        
        unknownCommand: 'Unknown command: {command}',
        seeHelp: 'Type "help" to see available commands.',
        executionFailed: '❌ Error occurred during execution: {message}',
        unexpectedError: '❌ Unexpected error occurred: {message}'
    },
    kr: {
        sheetNameEmpty: '시트명이 비어있습니다.',
        sheetNameTooLong: '시트명이 너무 깁니다 (최대 31자, 현재: {length}자)',
        sheetNameInvalidChars: '허용되지 않는 문자 포함: {chars}',
        sheetNameWhitespace: '시트명 앞뒤에 공백이 있습니다.',
        
        helpMessage: 
        `SQL2Excel 도구 v1.2
        사용법: node src/excel-cli.js <명령> [옵션]',
        명령:',
          export                     SQL 쿼리 결과를 엑셀 파일로 내보내기',
          validate                   쿼리문정의 파일 검증',
          list-dbs                   데이터베이스 목록 표시 (연결 가능 여부 포함)',
          help                       도움말 표시',
        옵션:',
          --query, -q <파일경로>     쿼리 정의 파일 경로 (JSON)',
          --xml, -x <파일경로>       쿼리 정의 파일 경로 (XML)',
          --config, -c <파일경로>    DB 접속 정보 파일 (기본: config/dbinfo.json)',
          --var, -v <key=value>      쿼리 변수 (key=value 형태, 여러 개 가능)',
        예시:',
          node src/excel-cli.js export --xml ./queries/sample-queries.xml',
          node src/excel-cli.js export --query ./queries/sample-queries.json',
          node src/excel-cli.js validate --xml ./queries/sample-queries.xml',
          node src/excel-cli.js list-dbs',
          node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"',
        환경 변수 설정:',
          config/dbinfo.json 파일에서 데이터베이스 연결 정보를 설정하세요.`,
        
        configFileNotFound: '설정 파일을 찾을 수 없습니다: {path}',
        configFileInvalid: '설정 파일 형식이 올바르지 않습니다.',
        configFileLoadFailed: '설정 파일 로드 실패: {message}',
        
        dbConnecting: '  {dbKey}: 연결 중...',
        dbConnectionSuccess: '  {dbKey}: ✅ 연결 성공',
        dbConnectionFailed: '  {dbKey}: ❌ 연결 실패 - {message}',
        
        dbTestStarting: '📋 데이터베이스 연결 테스트 시작\n',
        noDatabasesConfigured: '❌ 설정된 데이터베이스가 없습니다.',
        dbTestCount: '총 {count}개 데이터베이스 연결 테스트:\n',
        dbTestSummaryHeader: '📊 연결 테스트 결과 요약',
        dbTestTotalCount: '총 데이터베이스: {count}개',
        dbTestSuccessCount: '연결 성공: {count}개',
        dbTestFailureCount: '연결 실패: {count}개',
        dbTestFailedList: '\n❌ 연결 실패한 데이터베이스:',
        dbTestFailedItem: '  - {dbKey}: {message}',
        dbTestSuccessList: '\n✅ 연결 성공한 데이터베이스:',
        dbTestSuccessItem: '  - {dbKey}: {server}/{database}:{port}',
        dbTestFailed: '❌ 데이터베이스 연결 테스트 실패: {message}',
        
        queryValidationStarting: '📋 쿼리 파일 검증 시작\n',
        queryFilePathNotSpecified: '쿼리 파일 경로가 지정되지 않았습니다. --xml 또는 --query 옵션을 사용하세요.',
        queryFilePath: '파일 경로: {path}',
        queryFileType: '파일 형식: {type}',
        queryFileNotFound: '쿼리 파일을 찾을 수 없습니다: {path}',
        queryFileExists: '✅ 파일 존재 확인',
        xmlFormatInvalid: 'XML 파일 형식이 올바르지 않습니다. queries 및 sheet 요소가 필요합니다.',
        xmlFormatValid: '✅ XML 형식 검증',
        sheetCount: '   시트 개수: {count}개',
        sheetListHeader: '\n📋 시트 목록 및 검증:',
        sheetValidSuccess: '   ✅ 시트 #{index}: "{name}"',
        sheetValidFailed: '   ❌ 시트 #{index}: "{name}"',
        sheetValidErrorItem: '      - {error}',
        sheetValidAutoFix: '      💡 실행 시에는 자동으로 수정되어 처리됩니다.',
        queryDefCount: '\n📋 쿼리 정의 개수: {count}개',
        queryRefNotFound: '   ❌ 시트 "{sheetName}"에서 참조하는 쿼리 정의 "{queryRef}"를 찾을 수 없습니다.',
        queryRefValid: '   ✅ 시트 "{sheetName}" -> 쿼리 정의 "{queryRef}" 참조 확인',
        validationFailed: '\n❌ 검증 실패: 시트명 또는 쿼리 참조에 오류가 있습니다.',
        
        jsonFormatInvalid: 'JSON 파일 형식이 올바르지 않습니다. sheets 속성이 필요합니다.',
        jsonFormatValid: '✅ JSON 형식 검증',
        
        dbConfigLoaded: '\n✅ 데이터베이스 설정 로드',
        dbConfigCount: '   설정된 DB 개수: {count}개',
        dbUsageHeader: '\n📋 이 쿼리 파일에서 사용하는 데이터베이스 ({count}개):',
        dbUsageItem: '   ✅ {dbId}:',
        dbUsageServer: '      서버: {server}',
        dbUsageDatabase: '      데이터베이스: {database}',
        dbUsageUser: '      사용자: {user}',
        dbUsageWritable: '      쓰기 권한: {writable}',
        dbUsageDescription: '      설명: {description}',
        dbUsageNotFound: '   ❌ {dbId}: 설정 파일에서 찾을 수 없습니다.',
        dbUsageNone: '\n📋 데이터베이스 사용 정보:',
        dbUsageNoneInfo: '   ℹ️  쿼리 파일에서 명시적으로 지정된 DB가 없습니다.',
        dbUsageNoneDefault: '   💡 기본 DB가 사용됩니다.',
        dbNotFoundInConfig: '\n❌ 검증 실패: 설정 파일에서 찾을 수 없는 DB가 있습니다.',
        
        allValidationComplete: '\n✅ 모든 검증이 완료되었습니다.',
        queryValidationFailed: '❌ 쿼리 파일 검증 실패: {message}',
        
        toolHeader: '🔍 SQL2Excel 도구',
        jsonQueryFile: '📁 JSON 쿼리 파일: {path}',
        xmlQueryFile: '📁 XML 쿼리 파일: {path}',
        dbConfigFile: '📁 DB 설정 파일: {path}',
        variables: '📊 변수: {vars}',
        
        exportStarting: '엑셀 내보내기를 시작합니다...\n',
        exportFailed: '엑셀 내보내기 실행 중 오류가 발생했습니다: {message}',
        
        queryValidating: '쿼리 파일 검증 중...\n',
        queryFileValid: '✅ 쿼리 파일이 유효합니다.',
        queryFileInvalid: '❌ 쿼리 파일 검증에 실패했습니다.',
        
        unknownCommand: '알 수 없는 명령어: {command}',
        seeHelp: '사용 가능한 명령어를 확인하려면 "help"를 입력하세요.',
        executionFailed: '❌ 실행 중 오류가 발생했습니다: {message}',
        unexpectedError: '❌ 예상치 못한 오류가 발생했습니다: {message}'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 시트명 유효성 검증
 * @param {string} sheetName - 검증할 시트명
 * @param {boolean} skipLengthCheck - 길이 검증 건너뛰기 (변수 포함 시)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateSheetName(sheetName, skipLengthCheck = false) {
    const errors = [];
    
    const invalidChars = ['\\', '/', '*', '?', '[', ']', ':'];
    
    if (!sheetName || sheetName.trim() === '') {
        errors.push(msg.sheetNameEmpty);
        return { valid: false, errors };
    }
    
    if (!skipLengthCheck && sheetName.length > 31) {
        errors.push(msg.sheetNameTooLong.replace('{length}', sheetName.length));
    }
    
    const foundInvalidChars = invalidChars.filter(char => sheetName.includes(char));
    if (foundInvalidChars.length > 0) {
        errors.push(msg.sheetNameInvalidChars.replace('{chars}', foundInvalidChars.join(', ')));
    }
    
    if (sheetName !== sheetName.trim()) {
        errors.push(msg.sheetNameWhitespace);
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// 도움말 표시
function showHelp() {
    console.log(`${msg.helpMessage.replace('\n', '\n  ')}`);
}

// 옵션 파싱
function parseOptions(args) {
    const options = {
        queryFilePath: null,
        xmlFilePath: null,
        configFilePath: 'config/dbinfo.json',
        variables: {}
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '--query':
            case '-q':
                if (nextArg && !nextArg.startsWith('-')) {
                    options.queryFilePath = nextArg;
                    i++;
                }
                break;
            case '--xml':
            case '-x':
                if (nextArg && !nextArg.startsWith('-')) {
                    options.xmlFilePath = nextArg;
                    i++;
                }
                break;
            case '--config':
            case '-c':
                if (nextArg && !nextArg.startsWith('-')) {
                    options.configFilePath = nextArg;
                    i++;
                }
                break;
            case '--var':
            case '-v':
                if (nextArg && !nextArg.startsWith('-')) {
                    const [key, value] = nextArg.split('=');
                    if (key && value !== undefined) {
                        options.variables[key] = value;
                    }
                    i++;
                }
                break;
            case '--lang':
                // 언어 옵션은 무시 (app.js에서만 사용)
                if (nextArg && !nextArg.startsWith('-')) {
                    i++;
                }
                break;
            default:
                // 알 수 없는 옵션은 조용히 무시
                break;
        }
    }

    return options;
}

// 데이터베이스 설정 로드
function loadDatabaseConfig(configPath) {
    try {
        if (!fs.existsSync(configPath)) {
            throw new Error(msg.configFileNotFound.replace('{path}', configPath));
        }

        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);

        if (typeof config !== 'object' || !config) {
            throw new Error(msg.configFileInvalid);
        }

        return config;
    } catch (error) {
        throw new Error(msg.configFileLoadFailed.replace('{message}', error.message));
    }
}

// 데이터베이스 연결 테스트
async function testDatabaseConnection(dbKey, dbConfig) {
    let pool = null;
    try {
        console.log(msg.dbConnecting.replace('{dbKey}', dbKey));
        
        pool = new mssql.ConnectionPool({
            user: dbConfig.user,
            password: dbConfig.password,
            server: dbConfig.server,
            database: dbConfig.database,
            port: dbConfig.port || 1433,
            options: dbConfig.options || {
                encrypt: true,
                trustServerCertificate: true
            },
            connectionTimeout: 10000,
            requestTimeout: 5000
        });

        await pool.connect();
        
        const request = pool.request();
        await request.query('SELECT 1 as test');
        
        console.log(msg.dbConnectionSuccess.replace('{dbKey}', dbKey));
        return { success: true, message: msg.dbConnectionSuccess.replace('{dbKey}', '') };
        
    } catch (error) {
        console.log(msg.dbConnectionFailed.replace('{dbKey}', dbKey).replace('{message}', error.message));
        return { success: false, message: error.message };
        
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                // 연결 종료 오류는 무시
            }
        }
    }
}

// 모든 데이터베이스 연결 테스트
async function testAllDatabaseConnections(configPath) {
    try {
        console.log(msg.dbTestStarting);
        
        const databases = loadDatabaseConfig(configPath);
        const dbKeys = Object.keys(databases);
        
        if (dbKeys.length === 0) {
            console.log(msg.noDatabasesConfigured);
            return;
        }

        console.log(msg.dbTestCount.replace('{count}', dbKeys.length));
        
        const results = [];
        
        for (const dbKey of dbKeys) {
            const dbConfig = databases[dbKey];
            const result = await testDatabaseConnection(dbKey, dbConfig);
            results.push({
                dbKey,
                ...result,
                config: {
                    server: dbConfig.server,
                    database: dbConfig.database,
                    port: dbConfig.port || 1433
                }
            });
        }
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        console.log('='.repeat(80));
        console.log(msg.dbTestSummaryHeader);
        console.log('='.repeat(80));
        console.log(msg.dbTestTotalCount.replace('{count}', results.length));
        console.log(msg.dbTestSuccessCount.replace('{count}', successCount));
        console.log(msg.dbTestFailureCount.replace('{count}', failureCount));
        
        if (failureCount > 0) {
            console.log(msg.dbTestFailedList);
            results.filter(r => !r.success).forEach(r => {
                console.log(msg.dbTestFailedItem.replace('{dbKey}', r.dbKey).replace('{message}', r.message));
            });
        }
        
        console.log(msg.dbTestSuccessList);
        results.filter(r => r.success).forEach(r => {
            console.log(msg.dbTestSuccessItem
                .replace('{dbKey}', r.dbKey)
                .replace('{server}', r.config.server)
                .replace('{database}', r.config.database)
                .replace('{port}', r.config.port));
        });
        
        console.log('\n' + '='.repeat(80));
        
        return results;
        
    } catch (error) {
        console.error(msg.dbTestFailed.replace('{message}', error.message));
        throw error;
    }
}

// 쿼리 파일 검증
async function validateQueryFile(options) {
    try {
        console.log(msg.queryValidationStarting);
        
        let filePath = null;
        let fileType = null;
        
        if (options.xmlFilePath) {
            filePath = options.xmlFilePath;
            fileType = 'XML';
        } else if (options.queryFilePath) {
            filePath = options.queryFilePath;
            fileType = 'JSON';
        } else {
            throw new Error(msg.queryFilePathNotSpecified);
        }
        
        console.log(msg.queryFilePath.replace('{path}', filePath));
        console.log(msg.queryFileType.replace('{type}', fileType));
        
        if (!fs.existsSync(filePath)) {
            throw new Error(msg.queryFileNotFound.replace('{path}', filePath));
        }
        
        console.log(msg.queryFileExists);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        if (fileType === 'XML') {
            const xml2js = require('xml2js');
            const parsed = await xml2js.parseStringPromise(fileContent, { trim: true });
            
            if (!parsed.queries || !parsed.queries.sheet) {
                throw new Error(msg.xmlFormatInvalid);
            }
            
            console.log(msg.xmlFormatValid);
            
            const sheets = Array.isArray(parsed.queries.sheet) ? parsed.queries.sheet : [parsed.queries.sheet];
            console.log(msg.sheetCount.replace('{count}', sheets.length));
            
            console.log(msg.sheetListHeader);
            let hasValidationErrors = false;
            let sheetIndex = 0;
            
            for (const sheet of sheets) {
                if (sheet.$) {
                    sheetIndex++;
                    const sheetName = sheet.$.name || '';
                    
                    const hasVariables = sheetName.includes('${');
                    const sheetNameValidation = validateSheetName(sheetName, hasVariables);
                    
                    if (sheetNameValidation.valid) {
                        console.log(msg.sheetValidSuccess.replace('{index}', sheetIndex).replace('{name}', sheetName));
                    } else {
                        console.error(msg.sheetValidFailed.replace('{index}', sheetIndex).replace('{name}', sheetName));
                        sheetNameValidation.errors.forEach(error => {
                            console.error(msg.sheetValidErrorItem.replace('{error}', error));
                        });
                        console.error(msg.sheetValidAutoFix);
                        hasValidationErrors = true;
                    }
                }
            }
            
            if (parsed.queries.queryDefs && parsed.queries.queryDefs[0] && parsed.queries.queryDefs[0].queryDef) {
                const queryDefCount = Array.isArray(parsed.queries.queryDefs[0].queryDef) ? parsed.queries.queryDefs[0].queryDef.length : 1;
                console.log(msg.queryDefCount.replace('{count}', queryDefCount));
                
                const queryDefs = {};
                const queryDefArray = Array.isArray(parsed.queries.queryDefs[0].queryDef) ? parsed.queries.queryDefs[0].queryDef : [parsed.queries.queryDefs[0].queryDef];
                queryDefArray.forEach(def => {
                    if (def.$ && (def.$.id || def.$.name)) {
                        const queryId = def.$.id || def.$.name;
                        queryDefs[queryId] = true;
                    }
                });
                
                for (const sheet of sheets) {
                    if (sheet.$) {
                        const sheetName = sheet.$.name || '';
                        
                        if (sheet.$.queryRef) {
                            if (!queryDefs[sheet.$.queryRef]) {
                                console.error(msg.queryRefNotFound
                                    .replace('{sheetName}', sheetName)
                                    .replace('{queryRef}', sheet.$.queryRef));
                                hasValidationErrors = true;
                            } else {
                                console.log(msg.queryRefValid
                                    .replace('{sheetName}', sheetName)
                                    .replace('{queryRef}', sheet.$.queryRef));
                            }
                        }
                    }
                }
            }
            
            if (hasValidationErrors) {
                console.error(msg.validationFailed);
                return false;
            }
            
        } else if (fileType === 'JSON') {
            const JSON5 = require('json5');
            const parsed = JSON5.parse(fileContent);
            
            if (!parsed.sheets) {
                throw new Error(msg.jsonFormatInvalid);
            }
            
            console.log(msg.jsonFormatValid);
            console.log(msg.sheetCount.replace('{count}', parsed.sheets.length));
            
            console.log(msg.sheetListHeader);
            let hasValidationErrors = false;
            let sheetIndex = 0;
            
            for (const sheet of parsed.sheets) {
                sheetIndex++;
                const sheetName = sheet.name || '';
                
                const hasVariables = sheetName.includes('${');
                const sheetNameValidation = validateSheetName(sheetName, hasVariables);
                
                if (sheetNameValidation.valid) {
                    console.log(msg.sheetValidSuccess.replace('{index}', sheetIndex).replace('{name}', sheetName));
                } else {
                    console.error(msg.sheetValidFailed.replace('{index}', sheetIndex).replace('{name}', sheetName));
                    sheetNameValidation.errors.forEach(error => {
                        console.error(msg.sheetValidErrorItem.replace('{error}', error));
                    });
                    console.error(msg.sheetValidAutoFix);
                    hasValidationErrors = true;
                }
            }
            
            if (parsed.queryDefs) {
                const queryDefCount = Object.keys(parsed.queryDefs).length;
                console.log(msg.queryDefCount.replace('{count}', queryDefCount));
                
                for (const sheet of parsed.sheets) {
                    const sheetName = sheet.name || '';
                    
                    if (sheet.queryRef) {
                        if (!parsed.queryDefs[sheet.queryRef]) {
                            console.error(msg.queryRefNotFound
                                .replace('{sheetName}', sheetName)
                                .replace('{queryRef}', sheet.queryRef));
                            hasValidationErrors = true;
                        } else {
                            console.log(msg.queryRefValid
                                .replace('{sheetName}', sheetName)
                                .replace('{queryRef}', sheet.queryRef));
                        }
                    }
                }
            }
            
            if (hasValidationErrors) {
                console.error(msg.validationFailed);
                return false;
            }
        }
        
        const databases = loadDatabaseConfig(options.configFilePath);
        console.log(msg.dbConfigLoaded);
        console.log(msg.dbConfigCount.replace('{count}', Object.keys(databases).length));
        
        // 쿼리 파일에서 사용되는 DB 수집
        const usedDatabases = new Set();
        
        if (fileType === 'XML') {
            const xml2js = require('xml2js');
            const parsed = await xml2js.parseStringPromise(fileContent, { trim: true });
            
            // excel 태그의 db 속성 확인
            if (parsed.queries.excel && parsed.queries.excel[0] && parsed.queries.excel[0].$ && parsed.queries.excel[0].$.db) {
                usedDatabases.add(parsed.queries.excel[0].$.db);
            }
            
            // 각 시트의 db 속성 확인
            const sheets = Array.isArray(parsed.queries.sheet) ? parsed.queries.sheet : [parsed.queries.sheet];
            for (const sheet of sheets) {
                if (sheet.$ && sheet.$.db) {
                    usedDatabases.add(sheet.$.db);
                }
            }
            
            // dynamicVars의 database 속성 확인
            if (parsed.queries.dynamicVars && parsed.queries.dynamicVars[0] && parsed.queries.dynamicVars[0].dynamicVar) {
                const dynamicVars = Array.isArray(parsed.queries.dynamicVars[0].dynamicVar) 
                    ? parsed.queries.dynamicVars[0].dynamicVar 
                    : [parsed.queries.dynamicVars[0].dynamicVar];
                for (const dv of dynamicVars) {
                    if (dv.$ && dv.$.database) {
                        usedDatabases.add(dv.$.database);
                    }
                }
            }
        } else if (fileType === 'JSON') {
            const JSON5 = require('json5');
            const parsed = JSON5.parse(fileContent);
            
            // excel.db 확인
            if (parsed.excel && parsed.excel.db) {
                usedDatabases.add(parsed.excel.db);
            }
            
            // 각 시트의 db 확인
            if (parsed.sheets) {
                for (const sheet of parsed.sheets) {
                    if (sheet.db) {
                        usedDatabases.add(sheet.db);
                    }
                }
            }
            
            // dynamicVars의 database 확인
            if (parsed.dynamicVars) {
                for (const dv of parsed.dynamicVars) {
                    if (dv.database) {
                        usedDatabases.add(dv.database);
                    }
                }
            }
        }
        
        let dbValidationErrors = false;
        if (usedDatabases.size > 0) {
            console.log(msg.dbUsageHeader.replace('{count}', usedDatabases.size));
            for (const dbId of usedDatabases) {
                if (databases[dbId]) {
                    const dbConfig = databases[dbId];
                    console.log(msg.dbUsageItem.replace('{dbId}', dbId));
                    console.log(msg.dbUsageServer.replace('{server}', dbConfig.server));
                    console.log(msg.dbUsageDatabase.replace('{database}', dbConfig.database));
                    console.log(msg.dbUsageUser.replace('{user}', dbConfig.user));
                    const writableText = dbConfig.isWritable ? 
                        (LANGUAGE === 'kr' ? '있음' : 'Yes') : 
                        (LANGUAGE === 'kr' ? '없음' : 'No');
                    console.log(msg.dbUsageWritable.replace('{writable}', writableText));
                    if (dbConfig.description) {
                        console.log(msg.dbUsageDescription.replace('{description}', dbConfig.description));
                    }
                } else {
                    console.error(msg.dbUsageNotFound.replace('{dbId}', dbId));
                    dbValidationErrors = true;
                }
            }
        } else {
            console.log(msg.dbUsageNone);
            console.log(msg.dbUsageNoneInfo);
            console.log(msg.dbUsageNoneDefault);
        }
        
        if (dbValidationErrors) {
            console.error(msg.dbNotFoundInConfig);
            return false;
        }
        
        console.log(msg.allValidationComplete);
        return true;
        
    } catch (error) {
        console.error(msg.queryValidationFailed.replace('{message}', error.message));
        return false;
    }
}

// main 함수
async function main() {
    try {
        const args = process.argv.slice(2);
        const command = args[0];
        
        const options = parseOptions(args.slice(1));
        
        if (command !== 'list-dbs') {
            console.log('='.repeat(80));
            console.log(msg.toolHeader);
            console.log('='.repeat(80));
            if (options.queryFilePath) {
                console.log(msg.jsonQueryFile.replace('{path}', options.queryFilePath));
            }
            if (options.xmlFilePath) {
                console.log(msg.xmlQueryFile.replace('{path}', options.xmlFilePath));
            }
            console.log(msg.dbConfigFile.replace('{path}', options.configFilePath));
            if (Object.keys(options.variables).length > 0) {
                console.log(msg.variables.replace('{vars}', JSON.stringify(options.variables)));
            }
            console.log('');
        }
        
        switch (command) {
            case 'export':
                console.log(msg.exportStarting);
                
                const exportArgs = [];
                if (options.xmlFilePath) {
                    exportArgs.push('--xml', options.xmlFilePath);
                }
                if (options.queryFilePath) {
                    exportArgs.push('--query', options.queryFilePath);
                }
                if (options.configFilePath !== 'config/dbinfo.json') {
                    exportArgs.push('--config', options.configFilePath);
                }
                for (const [key, value] of Object.entries(options.variables)) {
                    exportArgs.push('--var', `${key}=${value}`);
                }
                
                try {
                    const { main: indexMain } = require('./index.js');
                    
                    const originalArgv = process.argv;
                    process.argv = ['node', 'src/index.js', ...exportArgs];
                    
                    await indexMain();
                    
                    process.argv = originalArgv;
                } catch (error) {
                    console.error(msg.exportFailed.replace('{message}', error.message));
                    process.exit(1);
                }
                break;
                
            case 'validate':
                console.log(msg.queryValidating);
                const isValid = await validateQueryFile(options);
                
                if (isValid) {
                    console.log(msg.queryFileValid);
                    process.exit(0);
                } else {
                    console.log(msg.queryFileInvalid);
                    process.exit(1);
                }
                break;
                
            case 'list-dbs':
                const results = await testAllDatabaseConnections(options.configFilePath);
                
                const hasFailures = results.some(r => !r.success);
                if (hasFailures) {
                    process.exit(1);
                } else {
                    process.exit(0);
                }
                break;
                
            case 'help':
            case undefined:
                showHelp();
                break;
                
            default:
                console.log(msg.unknownCommand.replace('{command}', command));
                console.log(msg.seeHelp);
                showHelp();
                process.exit(1);
        }
        
    } catch (error) {
        console.error(msg.executionFailed.replace('{message}', error.message));
        process.exit(1);
    }
}

// CLI로 실행된 경우에만 main 함수 실행
if (require.main === module) {
    main().catch(error => {
        console.error(msg.unexpectedError.replace('{message}', error.message));
        process.exit(1);
    });
}

module.exports = { main, showHelp, testAllDatabaseConnections, validateQueryFile };