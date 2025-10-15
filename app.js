const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// pkg 실행 파일 경로 처리
const APP_ROOT = process.pkg ? path.dirname(process.execPath) : __dirname;

// pkg 환경에서 excel-cli 모듈 직접 로드
const excelCli = process.pkg ? require('./src/excel-cli') : null;

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// 언어 설정 (명령줄 인수에서 가져오기)
const args = process.argv.slice(2);
const langArg = args.find(arg => arg.startsWith('--lang='));
const LANGUAGE = langArg ? langArg.split('=')[1] : 'en';

// 다국어 메시지
const messages = {
    en: {
        title: 'SQL2Excel Tool v1.2',
        menuTitle: 'Menu Selection',
        menu1: '1. Validate Query Definition File',
        menu2: '2. Test Database Connection',
        menu3: '3. Generate Excel File (XML)',
        menu4: '4. Generate Excel File (JSON)',
        menu5: '5. Show Help',
        menu0: '0. Exit',
        selectPrompt: 'Please select (0-5): ',
        invalidSelection: 'Invalid selection. Please try again.',
        
        // File selection
        selectFile: 'Select Query Definition File',
        availableFiles: 'Available query definition files:',
        selectFilePrompt: 'Select file number',
        noFilesFound: '(No query definition files found)',
        fileNotEntered: 'File number not entered.',
        invalidFileNumber: 'Invalid file number. Please enter a number between',
        selectedFile: 'Selected file:',
        
        // Validate
        validateTitle: 'Validate Query Definition File',
        validating: 'Validating query definition file...',
        validationCompleted: '✅ Query definition file validation completed.',
        validationFailed: '❌ Query definition file has errors.',
        
        // Test connection
        testConnectionTitle: 'Database Connection Test',
        testingConnection: 'Testing database connections...',
        connectionSuccess: '✅ Database connection test successful.',
        connectionFailed: '❌ Database connection failed.',
        checkConfig: 'Please check connection information in config/dbinfo.json.',
        
        // Export
        exportTitle: 'Generate Excel File',
        generating: 'Generating Excel file...',
        exportSuccess: '✅ Excel file generated successfully.',
        exportFailed: '❌ Error occurred while generating Excel file.',
        startTime: 'Start time:',
        endTime: 'End time:',
        
        // Help
        helpTitle: 'Help',
        helpText: 'SQL2Excel Tool - Export SQL query results to Excel files',
        helpFeatures: 'Features:',
        feature1: '- Multiple database connections support',
        feature2: '- XML and JSON query definition files',
        feature3: '- Variable substitution in queries',
        feature4: '- Excel styling and formatting',
        feature5: '- Multiple sheets support',
        helpUsage: 'Usage:',
        usage1: '1. Validate: Check query definition files',
        usage2: '2. Test Connection: Verify database connections',
        usage3: '3. Generate: Create Excel files from queries',
        helpConfig: 'Configuration:',
        config1: '- Database: config/dbinfo.json',
        config2: '- Queries: queries/ folder',
        config3: '- Output: output/ folder',
        
        // Common
        pressAnyKey: 'Press any key to continue...',
        goodbye: 'Thank you for using SQL2Excel Tool!'
    },
    kr: {
        title: 'SQL2Excel 도구 v1.2',
        menuTitle: '메뉴 선택',
        menu1: '1. 쿼리 정의 파일 검증',
        menu2: '2. 데이터베이스 연결 테스트',
        menu3: '3. 엑셀 파일 생성 (XML)',
        menu4: '4. 엑셀 파일 생성 (JSON)',
        menu5: '5. 도움말',
        menu0: '0. 종료',
        selectPrompt: '선택하세요 (0-5): ',
        invalidSelection: '잘못된 선택입니다. 다시 시도하세요.',
        
        // File selection
        selectFile: '쿼리 정의 파일 선택',
        availableFiles: '사용 가능한 쿼리 정의 파일:',
        selectFilePrompt: '파일 번호 선택',
        noFilesFound: '(쿼리 정의 파일이 없습니다)',
        fileNotEntered: '파일 번호가 입력되지 않았습니다.',
        invalidFileNumber: '잘못된 파일 번호입니다. 다음 범위에서 입력하세요',
        selectedFile: '선택된 파일:',
        
        // Validate
        validateTitle: '쿼리 정의 파일 검증',
        validating: '쿼리 정의 파일을 검증하고 있습니다...',
        validationCompleted: '✅ 쿼리 정의 파일 검증이 완료되었습니다.',
        validationFailed: '❌ 쿼리 정의 파일에 오류가 있습니다.',
        
        // Test connection
        testConnectionTitle: '데이터베이스 연결 테스트',
        testingConnection: '데이터베이스 연결을 테스트하고 있습니다...',
        connectionSuccess: '✅ 데이터베이스 연결 테스트가 성공했습니다.',
        connectionFailed: '❌ 데이터베이스 연결에 실패했습니다.',
        checkConfig: 'config/dbinfo.json 파일의 연결 정보를 확인하세요.',
        
        // Export
        exportTitle: '엑셀 파일 생성',
        generating: '엑셀 파일을 생성하고 있습니다...',
        exportSuccess: '✅ 엑셀 파일이 성공적으로 생성되었습니다.',
        exportFailed: '❌ 엑셀 파일 생성 중 오류가 발생했습니다.',
        startTime: '시작 시간:',
        endTime: '종료 시간:',
        
        // Help
        helpTitle: '도움말',
        helpText: 'SQL2Excel 도구 - SQL 쿼리 결과를 엑셀 파일로 내보내기',
        helpFeatures: '주요 기능:',
        feature1: '- 다중 데이터베이스 연결 지원',
        feature2: '- XML 및 JSON 쿼리 정의 파일',
        feature3: '- 쿼리 내 변수 치환',
        feature4: '- 엑셀 스타일링 및 포맷팅',
        feature5: '- 다중 시트 지원',
        helpUsage: '사용 방법:',
        usage1: '1. 검증: 쿼리 정의 파일 확인',
        usage2: '2. 연결 테스트: 데이터베이스 연결 확인',
        usage3: '3. 생성: 쿼리에서 엑셀 파일 생성',
        helpConfig: '설정:',
        config1: '- 데이터베이스: config/dbinfo.json',
        config2: '- 쿼리: queries/ 폴더',
        config3: '- 출력: output/ 폴더',
        
        // Common
        pressAnyKey: '계속하려면 아무 키나 누르세요...',
        goodbye: 'SQL2Excel 도구를 사용해주셔서 감사합니다!'
    }
};

const msg = messages[LANGUAGE] || messages.en;

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 질문 함수
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// 일시 정지
function pause() {
    return new Promise(resolve => {
        console.log(`\n${msg.pressAnyKey}`);
        rl.question('', () => {
            resolve();
        });
    });
}

// 헤더 출력
function printHeader() {
    console.clear();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.title}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
}

// 메뉴 출력
function printMenu() {
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.menuTitle}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    console.log(`  ${colors.green}${msg.menu1}${colors.reset}`);
    console.log(`  ${colors.green}${msg.menu2}${colors.reset}`);
    console.log();
    console.log(`  ${colors.green}${msg.menu3}${colors.reset}`);
    console.log(`  ${colors.green}${msg.menu4}${colors.reset}`);
    console.log();
    console.log(`  ${colors.green}${msg.menu5}${colors.reset}`);
    console.log(`  ${colors.red}${msg.menu0}${colors.reset}`);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
}

// 쿼리 파일 목록 가져오기
function getQueryFiles() {
    const files = [];
    const queriesDir = path.join(APP_ROOT, 'queries');
    
    // XML 파일
    if (fs.existsSync(queriesDir)) {
        const xmlFiles = fs.readdirSync(queriesDir).filter(f => f.endsWith('.xml'));
        xmlFiles.forEach(f => files.push({ path: path.join(queriesDir, f), name: f, type: 'XML' }));
        
        // JSON 파일
        const jsonFiles = fs.readdirSync(queriesDir).filter(f => f.endsWith('.json'));
        jsonFiles.forEach(f => files.push({ path: path.join(queriesDir, f), name: f, type: 'JSON' }));
    }
    
    return files;
}

// 파일 선택
async function selectFile() {
    const files = getQueryFiles();
    
    if (files.length === 0) {
        console.log(colors.yellow + `  ${msg.noFilesFound}` + colors.reset);
        console.log();
        await pause();
        return null;
    }
    
    console.log(`  ${msg.availableFiles}`);
    console.log();
    
    files.forEach((file, index) => {
        console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${file.name} (${file.type})`);
    });
    
    console.log();
    const fileNum = await question(`  ${msg.selectFilePrompt} (1-${files.length}): `);
    
    const num = parseInt(fileNum);
    if (isNaN(num) || num < 1 || num > files.length) {
        console.log(colors.red + `  ${msg.invalidFileNumber} 1-${files.length}` + colors.reset);
        console.log();
        await pause();
        return null;
    }
    
    const selectedFile = files[num - 1];
    console.log(`  ${colors.green}${msg.selectedFile}${colors.reset} ${selectedFile.name}`);
    console.log();
    
    return selectedFile;
}

// 검증
async function validateQuery() {
    printHeader();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.validateTitle}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    
    const file = await selectFile();
    if (!file) return;
    
    console.log(`  ${msg.validating}`);
    console.log();
    
    try {
        if (process.pkg) {
            // pkg 환경: 직접 모듈 사용
            const options = {
                configFilePath: path.join(APP_ROOT, 'config', 'dbinfo.json'),
                variables: {}
            };
            
            if (file.type === 'XML') {
                options.xmlFilePath = file.path;
            } else {
                options.queryFilePath = file.path;
            }
            
            const isValid = await excelCli.validateQueryFile(options);
            
            if (!isValid) {
                throw new Error('Validation failed');
            }
        } else {
            // Node.js 환경: CLI 실행
            const command = file.type === 'XML' 
                ? `node src/excel-cli.js validate --xml "${file.path}"`
                : `node src/excel-cli.js validate --query "${file.path}"`;
            
            execSync(command, { 
                cwd: APP_ROOT, 
                stdio: 'inherit',
                encoding: 'utf8'
            });
        }
        
        console.log();
        console.log(colors.green + `  ${msg.validationCompleted}` + colors.reset);
    } catch (error) {
        console.log();
        console.log(colors.red + `  ${msg.validationFailed}` + colors.reset);
    }
    
    console.log();
    await pause();
}

// 데이터베이스 연결 테스트
async function testConnection() {
    printHeader();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.testConnectionTitle}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    
    console.log(`  ${msg.testingConnection}`);
    console.log();
    
    try {
        if (process.pkg) {
            // pkg 환경: 직접 모듈 사용
            const configPath = path.join(APP_ROOT, 'config', 'dbinfo.json');
            await excelCli.testAllDatabaseConnections(configPath);
        } else {
            // Node.js 환경: CLI 실행
            execSync('node src/excel-cli.js list-dbs', { 
                cwd: APP_ROOT, 
                stdio: 'inherit',
                encoding: 'utf8'
            });
        }
        
        console.log();
        console.log(colors.green + `  ${msg.connectionSuccess}` + colors.reset);
    } catch (error) {
        console.log();
        console.log(colors.red + `  ${msg.connectionFailed}` + colors.reset);
        console.log(`  ${msg.checkConfig}`);
    }
    
    console.log();
    await pause();
}

// 엑셀 파일 생성 (XML)
async function exportExcelXML() {
    printHeader();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.exportTitle} (XML)` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    
    const files = getQueryFiles().filter(f => f.type === 'XML');
    
    if (files.length === 0) {
        console.log(colors.yellow + `  ${msg.noFilesFound}` + colors.reset);
        console.log();
        await pause();
        return;
    }
    
    console.log(`  ${msg.availableFiles}`);
    console.log();
    
    files.forEach((file, index) => {
        console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${file.name}`);
    });
    
    console.log();
    const fileNum = await question(`  ${msg.selectFilePrompt} (1-${files.length}): `);
    
    const num = parseInt(fileNum);
    if (isNaN(num) || num < 1 || num > files.length) {
        console.log(colors.red + `  ${msg.invalidFileNumber} 1-${files.length}` + colors.reset);
        console.log();
        await pause();
        return;
    }
    
    const selectedFile = files[num - 1];
    console.log(`  ${colors.green}${msg.selectedFile}${colors.reset} ${selectedFile.name}`);
    console.log();
    
    console.log(`  ${msg.generating}`);
    console.log();
    
    const startTime = new Date();
    
    try {
        if (process.pkg) {
            // pkg 환경: 직접 모듈 사용
            const originalArgv = process.argv;
            const originalExit = process.exit;

            // process.exit를 무효화하여 프로그램이 종료되지 않도록 함
            process.exit = (code) => {
                if (code !== 0) {
                    throw new Error(`Process exited with code ${code}`);
                }
            };

            // --lang 옵션을 제외하고 재구성
            const filteredArgs = originalArgv.slice(2).filter(arg => !arg.startsWith('--lang='));
            process.argv = ['node', 'src/excel-cli.js', 'export', '--xml', selectedFile.path, ...filteredArgs];

            try {
                await excelCli.main();
            } finally {
                process.argv = originalArgv;
                process.exit = originalExit;
            }
        } else {
            // Node.js 환경: CLI 실행
            execSync(`node src/excel-cli.js export --xml "${selectedFile.path}"`, { 
                cwd: APP_ROOT, 
                stdio: 'inherit',
                encoding: 'utf8'
            });
        }
        
        const endTime = new Date();
        
        console.log();
        console.log(colors.green + `  ${msg.exportSuccess}` + colors.reset);
        console.log(`  ${msg.startTime}: ${startTime.toLocaleTimeString()}`);
        console.log(`  ${msg.endTime}: ${endTime.toLocaleTimeString()}`);
    } catch (error) {
        console.log();
        console.log(colors.red + `  ${msg.exportFailed}` + colors.reset);
    }
    
    console.log();
    await pause();
}

// 엑셀 파일 생성 (JSON)
async function exportExcelJSON() {
    printHeader();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.exportTitle} (JSON)` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    
    const files = getQueryFiles().filter(f => f.type === 'JSON');
    
    if (files.length === 0) {
        console.log(colors.yellow + `  ${msg.noFilesFound}` + colors.reset);
        console.log();
        await pause();
        return;
    }
    
    console.log(`  ${msg.availableFiles}`);
    console.log();
    
    files.forEach((file, index) => {
        console.log(`  ${colors.cyan}${index + 1}.${colors.reset} ${file.name}`);
    });
    
    console.log();
    const fileNum = await question(`  ${msg.selectFilePrompt} (1-${files.length}): `);
    
    const num = parseInt(fileNum);
    if (isNaN(num) || num < 1 || num > files.length) {
        console.log(colors.red + `  ${msg.invalidFileNumber} 1-${files.length}` + colors.reset);
        console.log();
        await pause();
        return;
    }
    
    const selectedFile = files[num - 1];
    console.log(`  ${colors.green}${msg.selectedFile}${colors.reset} ${selectedFile.name}`);
    console.log();
    
    console.log(`  ${msg.generating}`);
    console.log();
    
    const startTime = new Date();
    
    try {
        if (process.pkg) {
            // pkg 환경: 직접 모듈 사용
            const originalArgv = process.argv;
            const originalExit = process.exit;

            // process.exit를 무효화하여 프로그램이 종료되지 않도록 함
            process.exit = (code) => {
                if (code !== 0) {
                    throw new Error(`Process exited with code ${code}`);
                }
            };

            // --lang 옵션을 제외하고 재구성
            const filteredArgs = originalArgv.slice(2).filter(arg => !arg.startsWith('--lang='));
            process.argv = ['node', 'src/excel-cli.js', 'export', '--query', selectedFile.path, ...filteredArgs];

            try {
                await excelCli.main();
            } finally {
                process.argv = originalArgv;
                process.exit = originalExit;
            }
        } else {
            // Node.js 환경: CLI 실행
            execSync(`node src/excel-cli.js export --query "${selectedFile.path}"`, { 
                cwd: APP_ROOT, 
                stdio: 'inherit',
                encoding: 'utf8'
            });
        }
        
        const endTime = new Date();
        
        console.log();
        console.log(colors.green + `  ${msg.exportSuccess}` + colors.reset);
        console.log(`  ${msg.startTime}: ${startTime.toLocaleTimeString()}`);
        console.log(`  ${msg.endTime}: ${endTime.toLocaleTimeString()}`);
    } catch (error) {
        console.log();
        console.log(colors.red + `  ${msg.exportFailed}` + colors.reset);
    }
    
    console.log();
    await pause();
}

// 도움말
async function showHelp() {
    printHeader();
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log(colors.cyan + colors.bright + `  ${msg.helpTitle}` + colors.reset);
    console.log(colors.cyan + '═'.repeat(60) + colors.reset);
    console.log();
    
    console.log(`  ${msg.helpText}`);
    console.log();
    
    console.log(colors.yellow + `  ${msg.helpFeatures}` + colors.reset);
    console.log(`  ${msg.feature1}`);
    console.log(`  ${msg.feature2}`);
    console.log(`  ${msg.feature3}`);
    console.log(`  ${msg.feature4}`);
    console.log(`  ${msg.feature5}`);
    console.log();
    
    console.log(colors.yellow + `  ${msg.helpUsage}` + colors.reset);
    console.log(`  ${msg.usage1}`);
    console.log(`  ${msg.usage2}`);
    console.log(`  ${msg.usage3}`);
    console.log();
    
    console.log(colors.yellow + `  ${msg.helpConfig}` + colors.reset);
    console.log(`  ${msg.config1}`);
    console.log(`  ${msg.config2}`);
    console.log(`  ${msg.config3}`);
    console.log();
    
    await pause();
}

// 메인 메뉴
async function mainMenu() {
    while (true) {
        printHeader();
        printMenu();
        
        const choice = await question(`  ${msg.selectPrompt}`);
        console.log();
        
        switch (choice) {
            case '1':
                await validateQuery();
                break;
            case '2':
                await testConnection();
                break;
            case '3':
                await exportExcelXML();
                break;
            case '4':
                await exportExcelJSON();
                break;
            case '5':
                await showHelp();
                break;
            case '0':
                console.log(colors.green + `  ${msg.goodbye}` + colors.reset);
                console.log();
                rl.close();
                process.exit(0);
                break;
            default:
                console.log(colors.red + `  ${msg.invalidSelection}` + colors.reset);
                console.log();
                await pause();
        }
    }
}

// 프로그램 시작
async function main() {
    try {
        await mainMenu();
    } catch (error) {
        console.error(colors.red + `\n  Error: ${error.message}` + colors.reset);
        rl.close();
        process.exit(1);
    }
}

// Ctrl+C 처리
process.on('SIGINT', () => {
    console.log(colors.yellow + '\n\n  Interrupted by user' + colors.reset);
    console.log(colors.green + `  ${msg.goodbye}` + colors.reset);
    console.log();
    rl.close();
    process.exit(0);
});

// 프로그램 실행
main();

