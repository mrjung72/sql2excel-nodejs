@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Quick JSON export batch file
echo =========================================
echo   SQL2Excel 빠른 JSON 실행
echo =========================================
echo.

:: Check if parameter provided
if "%~1"=="" (
    echo 사용법: export-json.bat [JSON파일경로] [변수1=값1] [변수2=값2] ...
    echo.
    echo 예시:
    echo   export-json.bat queries\my-queries.json
    echo   export-json.bat queries\my-queries.json year=2024 dept=IT
    echo.
    echo 사용 가능한 JSON 파일들:
    if exist "queries\*.json" (
        for %%f in (queries\*.json) do echo   - %%f
    ) else (
        echo   (JSON 파일이 없습니다)
    )
    echo.
    pause
    exit /b 1
)

set json_file=%~1
echo JSON 파일: %json_file%

:: Check if file exists
if not exist "%json_file%" (
    echo ❌ 파일을 찾을 수 없습니다: %json_file%
    echo.
    pause
    exit /b 1
)

:: Build variable parameters
set var_params=
shift
:parse_vars
if "%~1"=="" goto run_export
set var_params=%var_params% --var "%~1"
shift
goto parse_vars

:run_export
echo.
echo 엑셀 파일을 생성하고 있습니다...
echo.

if "%var_params%"=="" (
    node src/excel-cli.js export --query "%json_file%"
) else (
    echo 사용된 변수: %var_params%
    echo.
    node src/excel-cli.js export --query "%json_file%" %var_params%
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ 엑셀 파일이 성공적으로 생성되었습니다.
    echo.
    echo 출력 폴더를 열겠습니까? (Y/N)
    set /p open_folder=
    if /i "!open_folder!"=="Y" (
        explorer output
    )
) else (
    echo.
    echo ❌ 엑셀 파일 생성 중 오류가 발생했습니다.
)

echo.
pause