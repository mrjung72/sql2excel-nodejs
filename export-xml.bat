@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Quick XML export batch file
echo =========================================
echo   SQL2Excel 빠른 XML 실행
echo =========================================
echo.

:: Check if parameter provided
if "%~1"=="" (
    echo 사용법: export-xml.bat [XML파일경로]
    echo.
    echo 예시:
    echo   export-xml.bat queries\my-queries.xml
    echo.
    echo 사용 가능한 XML 파일들:
    if exist "queries\*.xml" (
        for %%f in (queries\*.xml) do echo   - %%f
    ) else (
        echo   (XML 파일이 없습니다)
    )
    echo.
    pause
    exit /b 1
)

set xml_file=%~1
echo XML 파일: %xml_file%

:: Check if file exists
if not exist "%xml_file%" (
    echo ❌ 파일을 찾을 수 없습니다: %xml_file%
    echo.
    pause
    exit /b 1
)

echo.
echo 엑셀 파일을 생성하고 있습니다...
echo.

node src/excel-cli.js export --xml "%xml_file%"

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