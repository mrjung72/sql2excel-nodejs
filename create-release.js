const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// package.json에서 버전 읽기
const pkg = require('./package.json');
const version = pkg.version;

console.log('================================================================================');
console.log('  SQL2Excel 배포판 생성 도구');
console.log('================================================================================');
console.log();
console.log(`현재 버전: ${version}`);
console.log();

// 배포 디렉토리 설정
const releaseDir = `release/sql2excel-v${version}-bin`;
const zipName = `sql2excel-v${version}-bin.zip`;

console.log(`배포 디렉토리: ${releaseDir}`);
console.log(`압축 파일명: ${zipName}`);
console.log();

// 기존 배포 디렉토리 정리
if (fs.existsSync('release')) {
    console.log('기존 release 디렉토리를 정리합니다...');
    fs.rmSync('release', { recursive: true, force: true });
}

// 배포 디렉토리 생성
console.log('배포 디렉토리를 생성합니다...');
fs.mkdirSync(releaseDir, { recursive: true });
fs.mkdirSync(`${releaseDir}/config`, { recursive: true });
fs.mkdirSync(`${releaseDir}/queries`, { recursive: true });
fs.mkdirSync(`${releaseDir}/templates`, { recursive: true });
fs.mkdirSync(`${releaseDir}/user_manual`, { recursive: true });

// 실행 파일 빌드
console.log();
console.log('================================================================================');
console.log('  실행 파일 빌드 중...');
console.log('================================================================================');
try {
    execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ 빌드 실패');
    process.exit(1);
}

// 필수 파일 복사
console.log();
console.log('================================================================================');
console.log('  필수 파일 복사 중...');
console.log('================================================================================');

const filesToCopy = [
    // 실행 파일
    { src: `dist/sql2excel-v${version}.exe`, dest: `${releaseDir}/sql2excel-v${version}.exe` },
    
    // 배치 파일 (버전별로 exe 파일명 교체)
    { src: 'sql2excel.bat', dest: `${releaseDir}/sql2excel.bat`, replaceVersion: true },
    
    // 설정 파일
    { src: 'config/dbinfo.json', dest: `${releaseDir}/config/dbinfo.json` },
    
    // 문서 파일 (USER_MANUAL.md는 버전별로 명령어 교체)
    { src: 'README.md', dest: `${releaseDir}/README.md` },
    { src: 'README_KR.md', dest: `${releaseDir}/README_KR.md` },
    { src: 'USER_MANUAL.md', dest: `${releaseDir}/user_manual/USER_MANUAL.md`},
    { src: 'USER_MANUAL_KR.md', dest: `${releaseDir}/user_manual/USER_MANUAL_KR.md`},
    { src: 'CHANGELOG.md', dest: `${releaseDir}/user_manual/CHANGELOG.md` },
    { src: 'CHANGELOG_KR.md', dest: `${releaseDir}/user_manual/CHANGELOG_KR.md` },
    { src: 'LICENSE', dest: `${releaseDir}/LICENSE` }
];

// 파일 복사
filesToCopy.forEach(({ src, dest, replaceVersion }) => {
    if (fs.existsSync(src)) {
        console.log(`- ${path.basename(dest)} 복사...`);
        
        if (replaceVersion) {
            let content = fs.readFileSync(src, 'utf8');
            
            if (src.endsWith('.bat')) {
                // Node.js 체크 부분 제거 (16-24번 라인)
                content = content.replace(
                    /:: Check Node\.js installation[\s\S]*?exit \/b 1\s*\)/m,
                    ':: Standalone executable - no Node.js check needed'
                );
                
                // node src/excel-cli.js를 sql2excel-v{version}.exe로 교체
                content = content.replace(/node src\/excel-cli\.js/g, `sql2excel-v${version}.exe`);
                
                console.log(`  → Node.js 체크 제거`);
                console.log(`  → node src/excel-cli.js를 sql2excel-v${version}.exe로 교체`);
            }
            
            fs.writeFileSync(dest, content);
        } else {
            fs.copyFileSync(src, dest);
        }
    } else {
        console.warn(`⚠️  파일을 찾을 수 없습니다: ${src}`);
    }
});

// 디렉토리 복사 함수
function copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// 쿼리 샘플 파일들 복사
console.log('- 쿼리 샘플 파일 복사...');
copyDirectory('queries', `${releaseDir}/queries`);

// 템플릿 파일 복사
console.log('- 템플릿 파일 복사...');
copyDirectory('templates', `${releaseDir}/templates`);

// 배포 정보 파일 생성
console.log('- 배포 정보 파일 생성...');
const deployInfo = `SQL2Excel v${version} Release Package

Build Date: ${new Date().toLocaleString('en-US')}

Included Files:
- sql2excel-v${version}.exe (Main executable file)
- sql2excel.bat (Menu interface)
- config/ (Database configuration)
- queries/ (Query sample files)
- templates/ (Excel style templates)
- user_manual/ (Documentation files - README, User Manual, etc.)

Usage:
1. Run sql2excel.bat
2. Configure database connection settings in config/dbinfo.json
3. Create queries by referring to sample files in queries/ folder
4. Select desired function from the menu

Features:
- Multi-sheet Excel generation from SQL queries
- Support for both XML and JSON query definitions
- Variable substitution in queries
- Multiple database support
- Excel styling and formatting options
- Data aggregation and statistics

System Requirements:
- Windows operating system
- SQL Server database access
- No additional software installation required (standalone executable)

Quick Start:
1. Extract all files to a folder
2. Edit config/dbinfo.json with your database connection details
3. Run sql2excel.bat to start the interactive menu
4. Choose option 3 or 4 to generate Excel files from sample queries

For detailed instructions, please refer to the user manual files in the user_manual/ folder.`;

fs.writeFileSync(`${releaseDir}/RELEASE_INFO.txt`, deployInfo);

// 파일 개수 확인
console.log();
console.log('================================================================================');
console.log('  배포 파일 확인');
console.log('================================================================================');

function countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            count += countFiles(filePath);
        } else {
            count++;
        }
    });
    return count;
}

const fileCount = countFiles(releaseDir);
console.log(`총 ${fileCount}개 파일이 복사되었습니다.`);
console.log();

// ZIP 파일 생성
console.log('================================================================================');
console.log('  ZIP 파일 생성 중...');
console.log('================================================================================');

const zipPath = `release/${zipName}`;
const releaseDirName = path.basename(releaseDir);

try {
    // PowerShell을 사용하여 ZIP 파일 생성
    const compressCommand = `powershell -Command "Compress-Archive -Path '${releaseDir}' -DestinationPath '${zipPath}' -Force"`;
    console.log(`압축 중: ${zipPath}`);
    execSync(compressCommand, { stdio: 'inherit' });
    console.log(`✅ ZIP 파일 생성 완료: ${zipPath}`);
} catch (error) {
    console.error('❌ ZIP 파일 생성 실패:', error.message);
}

console.log();

// 완료 메시지
console.log('================================================================================');
console.log('  배포판 생성 완료!');
console.log('================================================================================');
console.log();
console.log(`📁 배포 디렉토리: ${releaseDir}`);
console.log(`📦 압축 파일: ${zipPath}`);
console.log();
console.log('배포판 생성이 완료되었습니다.');
console.log('release 폴더를 확인해주세요.');
