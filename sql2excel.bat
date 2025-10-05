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

:: Check executable file
if not exist "sql2excel-v1.2.3.exe" (
    echo sql2excel-v1.2.3.exe file not found.
    echo Please make sure the executable file is in the current directory.
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
if exist "queries\*.xml" (
    for %%f in (queries\*.xml) do echo   - %%f
)
if exist "queries\*.json" (
    for %%f in (queries\*.json) do echo   - %%f
)
echo.

echo Enter the query file path (e.g., queries/my-queries.xml):
set /p query_file=
if "%query_file%"=="" (
    echo File path not entered.
    echo.
    pause
    goto MENU
)

if not exist "%query_file%" (
    echo File not found: %query_file%
    echo.
    pause
    goto MENU
)

:: Determine file type by extension
set file_type=json
if /i "%query_file:~-4%"==".xml" set file_type=xml

echo.
echo Validating query definition file...
echo.

if "%file_type%"=="xml" (
    sql2excel-v1.2.3.exe validate --xml "%query_file%"
) else (
    sql2excel-v1.2.3.exe validate --query "%query_file%"
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

sql2excel-v1.2.3.exe list-dbs

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
if exist "queries\*.xml" (
    for %%f in (queries\*.xml) do echo   - %%f
) else (
    echo   (No XML files found)
)
echo.

echo Enter XML file path (e.g., queries/my-queries.xml):
set /p xml_file=
if "%xml_file%"=="" (
    echo File path not entered.
    echo.
    pause
    goto MENU
)

if not exist "%xml_file%" (
    echo File not found: %xml_file%
    echo.
    pause
    goto MENU
)

echo.
echo Generating Excel file...
echo.
:: Record start time
set start_time=%time%

sql2excel-v1.2.3.exe export --xml "%xml_file%"

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
if exist "queries\*.json" (
    for %%f in (queries\*.json) do echo   - %%f
) else (
    echo   (No JSON files found)
)
echo.

echo Enter JSON file path (e.g., queries/my-queries.json):
set /p json_file=
if "%json_file%"=="" (
    echo File path not entered.
    echo.
    pause
    goto MENU
)

if not exist "%json_file%" (
    echo File not found: %json_file%
    echo.
    pause
    goto MENU
)

echo.
echo Generating Excel file...
echo.
:: Record start time
set start_time=%time%

sql2excel-v1.2.3.exe export --query "%json_file%"

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

sql2excel-v1.2.3.exe help

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
