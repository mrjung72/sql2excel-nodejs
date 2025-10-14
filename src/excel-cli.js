const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const yargs = require('yargs');

// 명령줄 인수 파싱
const args = process.argv.slice(2);
const command = args[0];

/**
 * 시트명 유효성 검증
 * @param {string} sheetName - 검증할 시트명
 * @param {boolean} skipLengthCheck - 길이 검증 건너뛰기 (변수 포함 시)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateSheetName(sheetName, skipLengthCheck = false) {
    const errors = [];
    
    // Excel 시트명에 사용할 수 없는 문자
    const invalidChars = ['\\', '/', '*', '?', '[', ']', ':'];
    
    // 1. 빈 문자열 체크
    if (!sheetName || sheetName.trim() === '') {
        errors.push('시트명이 비어있습니다.');
        return { valid: false, errors };
    }
    
    // 2. 최대 길이 체크 (31자) - 변수 포함 시 건너뛰기
    if (!skipLengthCheck && sheetName.length > 31) {
        errors.push(`시트명이 너무 깁니다 (최대 31자, 현재: ${sheetName.length}자)`);
    }
    
    // 3. 허용되지 않는 문자 체크
    const foundInvalidChars = invalidChars.filter(char => sheetName.includes(char));
    if (foundInvalidChars.length > 0) {
        errors.push(`허용되지 않는 문자 포함: ${foundInvalidChars.join(', ')}`);
    }
    
    // 4. 시트명 시작/끝 공백 체크
    if (sheetName !== sheetName.trim()) {
        errors.push('시트명 앞뒤에 공백이 있습니다.');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// 도움말 표시
function showHelp() {
    console.log(`
SQL2Excel 도구 v1.2
사용법: node src/excel-cli.js <명령> [옵션]

명령:
  export                     SQL 쿼리 결과를 엑셀 파일로 내보내기
  validate                   쿼리문정의 파일 검증
  list-dbs                   데이터베이스 목록 표시 (연결 가능 여부 포함)
  help                       도움말 표시

옵션:
  --query, -q <파일경로>     쿼리 정의 파일 경로 (JSON)
  --xml, -x <파일경로>       쿼리 정의 파일 경로 (XML)
  --config, -c <파일경로>    DB 접속 정보 파일 (기본: config/dbinfo.json)
  --var, -v <key=value>      쿼리 변수 (key=value 형태, 여러 개 가능)

예시:
  node src/excel-cli.js export --xml ./queries/sample-queries.xml
  node src/excel-cli.js export --query ./queries/sample-queries.json
  node src/excel-cli.js validate --xml ./queries/sample-queries.xml
  node src/excel-cli.js list-dbs
  node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

환경 변수 설정:
  config/dbinfo.json 파일에서 데이터베이스 연결 정보를 설정하세요.
`);
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
        }
    }

    return options;
}

// 데이터베이스 설정 로드
function loadDatabaseConfig(configPath) {
    try {
        if (!fs.existsSync(configPath)) {
            throw new Error(`설정 파일을 찾을 수 없습니다: ${configPath}`);
        }

        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);

        if (typeof config !== 'object' || !config) {
            throw new Error('설정 파일 형식이 올바르지 않습니다.');
        }

        return config;
    } catch (error) {
        throw new Error(`설정 파일 로드 실패: ${error.message}`);
    }
}

// 데이터베이스 연결 테스트
async function testDatabaseConnection(dbKey, dbConfig) {
    let pool = null;
    try {
        console.log(`  ${dbKey}: 연결 중...`);
        
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
        
        // 간단한 쿼리로 연결 확인
        const request = pool.request();
        await request.query('SELECT 1 as test');
        
        console.log(`  ${dbKey}: ✅ 연결 성공`);
        return { success: true, message: '연결 성공' };
        
    } catch (error) {
        console.log(`  ${dbKey}: ❌ 연결 실패 - ${error.message}`);
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
        console.log('📋 데이터베이스 연결 테스트 시작\n');
        
        const databases = loadDatabaseConfig(configPath);
        const dbKeys = Object.keys(databases);
        
        if (dbKeys.length === 0) {
            console.log('❌ 설정된 데이터베이스가 없습니다.');
            return;
        }

        console.log(`총 ${dbKeys.length}개 데이터베이스 연결 테스트:\n`);
        
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
        
        // 결과 요약
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        console.log('='.repeat(80));
        console.log('📊 연결 테스트 결과 요약');
        console.log('='.repeat(80));
        console.log(`총 데이터베이스: ${results.length}개`);
        console.log(`연결 성공: ${successCount}개`);
        console.log(`연결 실패: ${failureCount}개`);
        
        if (failureCount > 0) {
            console.log('\n❌ 연결 실패한 데이터베이스:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`  - ${r.dbKey}: ${r.message}`);
            });
        }
        
        console.log('\n✅ 연결 성공한 데이터베이스:');
        results.filter(r => r.success).forEach(r => {
            console.log(`  - ${r.dbKey}: ${r.config.server}/${r.config.database}:${r.config.port}`);
        });
        
        console.log('\n' + '='.repeat(80));
        
        return results;
        
    } catch (error) {
        console.error('❌ 데이터베이스 연결 테스트 실패:', error.message);
        throw error;
    }
}

// 쿼리 파일 검증
async function validateQueryFile(options) {
    try {
        console.log('📋 쿼리 파일 검증 시작\n');
        
        // 파일 경로 확인
        let filePath = null;
        let fileType = null;
        
        if (options.xmlFilePath) {
            filePath = options.xmlFilePath;
            fileType = 'XML';
        } else if (options.queryFilePath) {
            filePath = options.queryFilePath;
            fileType = 'JSON';
        } else {
            throw new Error('쿼리 파일 경로가 지정되지 않았습니다. --xml 또는 --query 옵션을 사용하세요.');
        }
        
        console.log(`파일 경로: ${filePath}`);
        console.log(`파일 형식: ${fileType}`);
        
        // 파일 존재 확인
        if (!fs.existsSync(filePath)) {
            throw new Error(`쿼리 파일을 찾을 수 없습니다: ${filePath}`);
        }
        
        console.log('✅ 파일 존재 확인');
        
        // 파일 내용 검증
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        if (fileType === 'XML') {
            const xml2js = require('xml2js');
            const parsed = await xml2js.parseStringPromise(fileContent, { trim: true });
            
            if (!parsed.queries || !parsed.queries.sheet) {
                throw new Error('XML 파일 형식이 올바르지 않습니다. queries 및 sheet 요소가 필요합니다.');
            }
            
            console.log('✅ XML 형식 검증');
            console.log(`   시트 개수: ${Array.isArray(parsed.queries.sheet) ? parsed.queries.sheet.length : 1}개`);
            
            // 쿼리 정의 확인
            if (parsed.queries.queryDefs && parsed.queries.queryDefs[0] && parsed.queries.queryDefs[0].queryDef) {
                const queryDefCount = Array.isArray(parsed.queries.queryDefs[0].queryDef) ? parsed.queries.queryDefs[0].queryDef.length : 1;
                console.log(`   쿼리 정의 개수: ${queryDefCount}개`);
                
                // 쿼리 참조 검증
                const sheets = Array.isArray(parsed.queries.sheet) ? parsed.queries.sheet : [parsed.queries.sheet];
                const queryDefs = {};
                
                // 쿼리 정의 수집
                const queryDefArray = Array.isArray(parsed.queries.queryDefs[0].queryDef) ? parsed.queries.queryDefs[0].queryDef : [parsed.queries.queryDefs[0].queryDef];
                queryDefArray.forEach(def => {
                    if (def.$ && (def.$.id || def.$.name)) {
                        const queryId = def.$.id || def.$.name;
                        queryDefs[queryId] = true;
                        console.log(`   [DEBUG] queryDef 발견: ${queryId}`);
                    }
                });
                console.log(`   [DEBUG] 총 ${Object.keys(queryDefs).length}개의 queryDef: ${Object.keys(queryDefs).join(', ')}`);
                
                // 쿼리 참조 검증 및 시트명 검증
                for (const sheet of sheets) {
                    if (sheet.$) {
                        // 시트명 검증 (변수 치환 전이므로 변수 포함 가능)
                        const sheetName = sheet.$.name || '';
                        
                        // 시트명 검증 (변수 포함 시 길이 검증만 건너뛰기)
                        const hasVariables = sheetName.includes('${');
                        const sheetNameValidation = validateSheetName(sheetName, hasVariables);
                        if (!sheetNameValidation.valid) {
                            console.error(`\n❌ 시트명 검증 실패:`);
                            console.error(`   시트명: "${sheetName}"`);
                            sheetNameValidation.errors.forEach(error => {
                                console.error(`   - ${error}`);
                            });
                            throw new Error(`시트명 검증 실패: "${sheetName}"`);
                        }
                        
                        // 쿼리 참조 검증
                        if (sheet.$.queryRef) {
                            if (!queryDefs[sheet.$.queryRef]) {
                                throw new Error(`시트 "${sheetName}"에서 참조하는 쿼리 정의 "${sheet.$.queryRef}"를 찾을 수 없습니다.`);
                            }
                            console.log(`   ✅ 시트 "${sheetName}" -> 쿼리 정의 "${sheet.$.queryRef}" 참조 확인`);
                        }
                    }
                }
            }
            
        } else if (fileType === 'JSON') {
            const JSON5 = require('json5');
            const parsed = JSON5.parse(fileContent);
            
            if (!parsed.sheets) {
                throw new Error('JSON 파일 형식이 올바르지 않습니다. sheets 속성이 필요합니다.');
            }
            
            console.log('✅ JSON 형식 검증');
            console.log(`   시트 개수: ${parsed.sheets.length}개`);
            
            // 쿼리 정의 확인
            if (parsed.queryDefs) {
                const queryDefCount = Object.keys(parsed.queryDefs).length;
                console.log(`   쿼리 정의 개수: ${queryDefCount}개`);
                
                // 쿼리 참조 검증 및 시트명 검증
                for (const sheet of parsed.sheets) {
                    const sheetName = sheet.name || '';
                    
                    // 시트명 검증 (변수 포함 시 길이 검증만 건너뛰기)
                    const hasVariables = sheetName.includes('${');
                    const sheetNameValidation = validateSheetName(sheetName, hasVariables);
                    if (!sheetNameValidation.valid) {
                        console.error(`\n❌ 시트명 검증 실패:`);
                        console.error(`   시트명: "${sheetName}"`);
                        sheetNameValidation.errors.forEach(error => {
                            console.error(`   - ${error}`);
                        });
                        throw new Error(`시트명 검증 실패: "${sheetName}"`);
                    }
                    
                    // 쿼리 참조 검증
                    if (sheet.queryRef) {
                        if (!parsed.queryDefs[sheet.queryRef]) {
                            throw new Error(`시트 "${sheetName}"에서 참조하는 쿼리 정의 "${sheet.queryRef}"를 찾을 수 없습니다.`);
                        }
                        console.log(`   ✅ 시트 "${sheetName}" -> 쿼리 정의 "${sheet.queryRef}" 참조 확인`);
                    }
                }
            }
        }
        
        // 데이터베이스 설정 확인
        const databases = loadDatabaseConfig(options.configFilePath);
        console.log('✅ 데이터베이스 설정 로드');
        console.log(`   설정된 DB 개수: ${Object.keys(databases).length}개`);
        
        console.log('\n✅ 모든 검증이 완료되었습니다.');
        return true;
        
    } catch (error) {
        console.error('❌ 쿼리 파일 검증 실패:', error.message);
        return false;
    }
}

// main 함수
async function main() {
    try {
        console.log('[DEBUG] args:', args);
        console.log('[DEBUG] command:', command);
        const options = parseOptions(args.slice(1));
        console.log('[DEBUG] options:', options);
        
        // 명령어 정보 출력
        if (command !== 'list-dbs') {
            console.log('='.repeat(80));
            console.log('🔍 SQL2Excel 도구');
            console.log('='.repeat(80));
            if (options.queryFilePath) {
                console.log(`📁 JSON 쿼리 파일: ${options.queryFilePath}`);
            }
            if (options.xmlFilePath) {
                console.log(`📁 XML 쿼리 파일: ${options.xmlFilePath}`);
            }
            console.log(`📁 DB 설정 파일: ${options.configFilePath}`);
            if (Object.keys(options.variables).length > 0) {
                console.log(`📊 변수: ${JSON.stringify(options.variables)}`);
            }
            console.log('');
        }
        
        switch (command) {
            case 'export':
                console.log('엑셀 내보내기를 시작합니다...\n');
                
                // 기존 CLI 인자 형태로 변환
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
                    // 직접 index.js의 main 함수를 호출하여 pkg 빌드와 호환되도록 함
                    const { main: indexMain } = require('./index.js');
                    
                    // process.argv를 임시로 수정하여 yargs가 올바른 인수를 받도록 함
                    const originalArgv = process.argv;
                    process.argv = ['node', 'src/index.js', ...exportArgs];
                    
                    console.log(`실행 명령어: node src/index.js ${exportArgs.join(' ')}\n`);
                    
                    // index.js의 main 함수를 직접 호출
                    await indexMain();
                    
                    // process.argv 복원
                    process.argv = originalArgv;
                } catch (error) {
                    console.error('엑셀 내보내기 실행 중 오류가 발생했습니다:', error.message);
                    process.exit(1);
                }
                break;
                
            case 'validate':
                console.log('쿼리 파일 검증 중...\n');
                const isValid = await validateQueryFile(options);
                
                if (isValid) {
                    console.log('✅ 쿼리 파일이 유효합니다.');
                    process.exit(0);
                } else {
                    console.log('❌ 쿼리 파일 검증에 실패했습니다.');
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
                console.log(`알 수 없는 명령어: ${command}`);
                console.log('사용 가능한 명령어를 확인하려면 "help"를 입력하세요.');
                showHelp();
                process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 실행 중 오류가 발생했습니다:', error.message);
        process.exit(1);
    }
}

// CLI로 실행된 경우에만 main 함수 실행
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 예상치 못한 오류가 발생했습니다:', error.message);
        process.exit(1);
    });
}

module.exports = { main, showHelp, testAllDatabaseConnections, validateQueryFile };