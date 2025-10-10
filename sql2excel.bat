@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: English output setup
color 0F

:HEADER
cls
echo.
echo =========================================
echo   SQL2Excel Tool v1.2
echo =========================================
echo.

:: Check Node.js installation
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js가 설치되지 않았습니다.
    echo https://nodejs.org 에서 Node.js를 설치해주세요.
    echo.
    pause
    exit /b 1
)

:MENU
echo =========================================
echo   Menu Selection
echo =========================================
echo 1. Validate Query Definition File
echo.
echo 2. Test Database Connection
echo.
echo 3. Generate Excel File (XML File)
echo 4. Generate Excel File (JSON File)
echo.
echo 5. Show Help
echo 0. Exit
echo =========================================
echo.
set /p choice=Please select (0-5): 

if "%choice%"=="1" goto VALIDATE
if "%choice%"=="2" goto TEST_DB
if "%choice%"=="3" goto EXPORT_XML
if "%choice%"=="4" goto EXPORT_JSON
if "%choice%"=="5" goto HELP
if "%choice%"=="0" goto EXIT

echo Invalid selection. Please try again.
echo.
pause
goto MENU

:VALIDATE
echo.
echo =========================================
echo   Query Definition File Validation
echo =========================================
echo.
echo Available query definition files:
echo.

:: Build file list with numbers
set file_count=0
set "file_list="

:: List XML files
if exist "queries\*.xml" (
    for %%f in (queries\*.xml) do (
        set /a file_count+=1
        set "file_!file_count!=%%f"
        echo   !file_count!. %%f
    )
)

:: List JSON files
if exist "queries\*.json" (
    for %%f in (queries\*.json) do (
        set /a file_count+=1
        set "file_!file_count!=%%f"
        echo   !file_count!. %%f
    )
)

if %file_count% equ 0 (
    echo   (No query definition files found)
    echo.
    pause
    goto MENU
)

echo.
set /p file_num=Select file number (1-%file_count%): 

:: Validate input
if "%file_num%"=="" (
    echo File number not entered.
    echo.
    pause
    goto MENU
)

:: Check if number is in valid range
if %file_num% lss 1 (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)
if %file_num% gtr %file_count% (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)

:: Get selected file
call set query_file=%%file_%file_num%%%
echo.
echo Selected file: %query_file%

:: Determine file type by extension
set file_type=json
if /i "%query_file:~-4%"==".xml" set file_type=xml

echo.
echo Validating query definition file...
echo.

if "%file_type%"=="xml" (
    node src/excel-cli.js validate --xml "%query_file%"
) else (
    node src/excel-cli.js validate --query "%query_file%"
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ Query definition file validation completed.
) else (
    echo.
    echo ❌ Query definition file has errors.
)

echo.
pause
goto MENU

:TEST_DB
echo.
echo =========================================
echo   Database Connection Test
echo =========================================
echo.
echo Testing configured database connections...
echo.

node src/excel-cli.js list-dbs

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database connection test completed.
) else (
    echo.
    echo ❌ Database connection failed.
    echo Please check the connection information in config/dbinfo.json.
)

echo.
pause
goto MENU

:EXPORT_XML
echo.
echo =========================================
echo   Generate Excel File (XML)
echo =========================================
echo.
echo Available XML query definition files:
echo.

:: Build XML file list with numbers
set xml_count=0

if exist "queries\*.xml" (
    for %%f in (queries\*.xml) do (
        set /a xml_count+=1
        set "xml_file_!xml_count!=%%f"
        echo   !xml_count!. %%f
    )
) else (
    echo   (No XML files found)
)

if %xml_count% equ 0 (
    echo.
    pause
    goto MENU
)

echo.
set /p xml_num=Select XML file number (1-%xml_count%): 

:: Validate input
if "%xml_num%"=="" (
    echo File number not entered.
    echo.
    pause
    goto MENU
)

if %xml_num% lss 1 (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)
if %xml_num% gtr %xml_count% (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)

:: Get selected file
call set xml_file=%%xml_file_%xml_num%%%
echo.
echo Selected file: %xml_file%

echo.
echo Generating Excel file...
echo.
:: Record start time
set start_time=%time%

node src/excel-cli.js export --xml "%xml_file%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Excel file generated successfully.
    echo Start time: %start_time%
    echo End time: %time%
    echo.
) else (
    echo.
    echo ❌ Error occurred while generating Excel file.
)

echo.
pause
goto MENU

:EXPORT_JSON
echo.
echo =========================================
echo   Generate Excel File (JSON)
echo =========================================
echo.
echo Available JSON query definition files:
echo.

:: Build JSON file list with numbers
set json_count=0

if exist "queries\*.json" (
    for %%f in (queries\*.json) do (
        set /a json_count+=1
        set "json_file_!json_count!=%%f"
        echo   !json_count!. %%f
    )
) else (
    echo   (No JSON files found)
)

if %json_count% equ 0 (
    echo.
    pause
    goto MENU
)

echo.
set /p json_num=Select JSON file number (1-%json_count%): 

:: Validate input
if "%json_num%"=="" (
    echo File number not entered.
    echo.
    pause
    goto MENU
)

if %json_num% lss 1 (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)
if %json_num% gtr %json_count% (
    echo Invalid file number.
    echo.
    pause
    goto MENU
)

:: Get selected file
call set json_file=%%json_file_%json_num%%%
echo.
echo Selected file: %json_file%

echo.
echo Generating Excel file...
echo.
:: Record start time
set start_time=%time%

node src/excel-cli.js export --query "%json_file%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Excel file generated successfully.
    echo Start time: %start_time%
    echo End time: %time%
    echo.
    echo Would you like to open the output folder? (Y/N)
    set /p open_folder=
    if /i "!open_folder!"=="Y" (
        explorer output
    )
) else (
    echo.
    echo ❌ Error occurred while generating Excel file.
)

echo.
pause
goto MENU

:HELP
echo.
echo =========================================
echo   Help
echo =========================================
echo.

node src/excel-cli.js help

echo.
echo Additional Information:
echo - Query Definition Reuse: From v1.2, you can reuse queries with queryRef attribute
echo - XML Files: Define queries in XML format in queries/ folder
echo - JSON Files: Define queries in JSON format in queries/ folder
echo - Variables: Use variables in queries for dynamic content
echo - Multi-Database: Support multiple database connections
echo - Excel Styling: Apply various Excel styles and formatting
echo.
echo Configuration:
echo - Database settings: config/dbinfo.json
echo - Query samples: queries/ folder
echo - Output files: output/ folder
echo - Style templates: templates/ folder
echo.
pause
goto MENU

:EXIT
echo.
echo Thank you for using SQL2Excel Tool!
echo.
pause
exit /b 0
