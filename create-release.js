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
const releaseDir = `release/sql2excel-v${version}`;
const zipName = `sql2excel-v${version}.zip`;

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
    
    // 배치 파일
    { src: 'dist/sql2excel.bat', dest: `${releaseDir}/sql2excel.bat` },
    
    // 설정 파일
    { src: 'config/dbinfo.json', dest: `${releaseDir}/config/dbinfo.json` },
    
    // 문서 파일
    { src: 'README.md', dest: `${releaseDir}/README.md` },
    { src: 'README_KR.md', dest: `${releaseDir}/README_KR.md` },
    { src: 'USER_MANUAL.md', dest: `${releaseDir}/USER_MANUAL.md` },
    { src: 'USER_MANUAL_KR.md', dest: `${releaseDir}/USER_MANUAL_KR.md` },
    { src: 'CHANGELOG.md', dest: `${releaseDir}/CHANGELOG.md` },
    { src: 'CHANGELOG_KR.md', dest: `${releaseDir}/CHANGELOG_KR.md` },
    { src: 'LICENSE', dest: `${releaseDir}/LICENSE` },
    { src: 'RELEASE_README.md', dest: `${releaseDir}/배포판_README.md` },
];

// 파일 복사
filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
        console.log(`- ${path.basename(dest)} 복사...`);
        fs.copyFileSync(src, dest);
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
const deployInfo = `SQL2Excel v${version} 배포판

빌드 날짜: ${new Date().toLocaleString('ko-KR')}

포함된 파일:
- sql2excel-v${version}.exe (메인 실행 파일)
- sql2excel.bat (메뉴 인터페이스)
- config/ (데이터베이스 설정)
- queries/ (쿼리 샘플 파일)
- templates/ (엑셀 스타일 템플릿)
- 문서 파일들 (README, 사용자 매뉴얼 등)

사용법:
1. sql2excel.bat 실행
2. config/dbinfo.json에서 데이터베이스 연결 정보 설정
3. queries/ 폴더의 샘플 파일 참고하여 쿼리 작성
4. 메뉴에서 원하는 기능 선택하여 실행`;

fs.writeFileSync(`${releaseDir}/배포정보.txt`, deployInfo);

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

// 완료 메시지
console.log('================================================================================');
console.log('  배포판 생성 완료!');
console.log('================================================================================');
console.log();
console.log(`📁 배포 디렉토리: ${releaseDir}`);
console.log();
console.log('배포판 생성이 완료되었습니다.');
console.log('release 폴더를 확인해주세요.');
