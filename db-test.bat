@echo off
chcp 65001 >nul

:: Quick database connection test batch file
echo =========================================
echo   SQL2Excel DB 연결 테스트
echo =========================================
echo.

echo 설정된 데이터베이스 연결을 테스트하고 있습니다...
echo.

node src/excel-cli.js list-dbs

if %errorlevel% equ 0 (
    echo.
    echo ✅ 데이터베이스 연결 테스트가 완료되었습니다.
) else (
    echo.
    echo ❌ 데이터베이스 연결에 실패했습니다.
    echo config/dbinfo.json 파일의 연결 정보를 확인해주세요.
)

echo.
pause