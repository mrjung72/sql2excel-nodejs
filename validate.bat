@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Quick validation batch file
echo =========================================
echo   SQL2Excel 쿼리 파일 검증
echo =========================================
echo.

:: Check if parameter provided
if "%~1"=="" (
    echo 사용법: validate.bat [파일경로]
    echo.
    echo 예시:
    echo   validate.bat queries\my-queries.xml
    echo   validate.bat queries\my-queries.json
    echo.
    echo 사용 가능한 파일들:
    if exist "queries\*.xml" (
        echo [XML 파일들]
        for %%f in (queries\*.xml) do echo   - %%f
    )
    if exist "queries\*.json" (
        echo [JSON 파일들]
        for %%f in (queries\*.json) do echo   - %%f
    )
    if not exist "queries\*.xml" if not exist "queries\*.json" (
        echo   (쿼리 파일이 없습니다)
    )
    echo.
    pause
    exit /b 1
)

set query_file=%~1
echo 검증할 파일: %query_file%

:: Check if file exists
if not exist "%query_file%" (
    echo ❌ 파일을 찾을 수 없습니다: %query_file%
    echo.
    pause
    exit /b 1
)

:: Determine file type
echo %query_file% | findstr /i "\.xml$" >nul
if %errorlevel% equ 0 (
    set file_type=xml
    echo 파일 형식: XML
) else (
    set file_type=json
    echo 파일 형식: JSON
)

echo.
echo 쿼리문정의 파일을 검증하고 있습니다...
echo.

if "%file_type%"=="xml" (
    node src/excel-cli.js validate --xml "%query_file%"
) else (
    node src/excel-cli.js validate --query "%query_file%"
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ 검증이 성공적으로 완료되었습니다.
) else (
    echo.
    echo ❌ 검증 중 오류가 발생했습니다.
)

echo.
pause