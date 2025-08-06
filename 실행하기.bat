@echo off
chcp 65001 >nul

:: SQL2Excel 도구 실행 - 메인 메뉴로 이동
echo =========================================
echo   SQL2Excel 도구 v1.2
echo =========================================
echo.
echo 메인 메뉴로 이동합니다...
echo.

:: Launch main menu
call sql2excel.bat

:: If main batch doesn't exist, show simple menu
if %errorlevel% neq 0 (
    echo.
    echo sql2excel.bat 파일을 찾을 수 없습니다.
    echo 기본 실행을 진행합니다...
    echo.
    
    set XML_FILE=queries\queries-sample.xml
    set JSON_FILE=queries\queries-sample-orders.json
    
    echo 사용 가능한 실행 옵션:
    echo 1. XML 파일 실행 (기본)
    echo 2. JSON 파일 실행
    echo.
    set /p choice=선택하세요 (1-2, 기본값: 1): 
    
    if "%choice%"=="2" (
        if exist "%JSON_FILE%" (
            echo JSON 파일을 실행합니다: %JSON_FILE%
            node src\index.js -q %JSON_FILE% -c config\dbinfo.json
        ) else (
            echo JSON 파일을 찾을 수 없습니다: %JSON_FILE%
        )
    ) else (
        if exist "%XML_FILE%" (
            echo XML 파일을 실행합니다: %XML_FILE%
            node src\index.js -x %XML_FILE% -c config\dbinfo.json
        ) else (
            echo XML 파일을 찾을 수 없습니다: %XML_FILE%
        )
    )
    
    pause
) 