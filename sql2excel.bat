@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Korean output setup
color 0F

:HEADER
cls
echo.
echo =========================================
echo   SQL2Excel 도구 v1.2
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
echo   메뉴 선택
echo =========================================
echo 1. 쿼리문정의 파일 검증
echo.
echo 2. 데이터베이스 연결 테스트
echo.
echo 3. 엑셀 파일 생성 (XML 파일)
echo 4. 엑셀 파일 생성 (JSON 파일)
echo.
echo 5. 고급 메뉴 (파일 편집, 설정 등)
echo 6. 도움말 보기
echo 0. 종료
echo =========================================
echo.
set /p choice=선택하세요 (0-6): 

if "%choice%"=="1" goto VALIDATE
if "%choice%"=="2" goto TEST_DB
if "%choice%"=="3" goto EXPORT_XML
if "%choice%"=="4" goto EXPORT_JSON
if "%choice%"=="5" goto ADVANCED
if "%choice%"=="6" goto HELP
if "%choice%"=="0" goto EXIT

echo 잘못된 선택입니다. 다시 선택해주세요.
echo.
pause
goto MENU

:VALIDATE
echo.
echo =========================================
echo   쿼리문정의 파일 검증
echo =========================================
echo.
echo 사용 가능한 쿼리문정의 파일들:
echo.
if exist "queries\*.xml" (
    echo [XML 파일들]
    for %%f in (queries\*.xml) do echo   - %%f
    echo.
)
if exist "queries\*.json" (
    echo [JSON 파일들]
    for %%f in (queries\*.json) do echo   - %%f
    echo.
)

echo 검증할 파일 경로를 입력하세요 (예: queries/my-queries.xml):
set /p query_file=
if "%query_file%"=="" (
    echo 파일 경로가 입력되지 않았습니다.
    echo.
    pause
    goto MENU
)

:: Determine file type by extension
set file_type=json
if /i "%query_file:~-4%"==".xml" set file_type=xml

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
    echo ✅ 쿼리문정의 파일 검증이 완료되었습니다.
) else (
    echo.
    echo ❌ 쿼리문정의 파일에 오류가 있습니다.
)

echo.
pause
goto MENU

:TEST_DB
echo.
echo =========================================
echo   데이터베이스 연결 테스트
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
goto MENU

:EXPORT_XML
echo.
echo =========================================
echo   엑셀 파일 생성 (XML)
echo =========================================
echo.
echo 사용 가능한 XML 쿼리문정의 파일들:
echo.
if exist "queries\*.xml" (
    for %%f in (queries\*.xml) do echo   - %%f
) else (
    echo   (XML 파일이 없습니다)
)
echo.

echo XML 파일 경로를 입력하세요 (예: queries/my-queries.xml):
set /p xml_file=
if "%xml_file%"=="" (
    echo 파일 경로가 입력되지 않았습니다.
    echo.
    pause
    goto MENU
)

if not exist "%xml_file%" (
    echo 파일을 찾을 수 없습니다: %xml_file%
    echo.
    pause
    goto MENU
)

echo.
echo 엑셀 파일을 생성하고 있습니다...
echo.
:: Record start time
set start_time=%time%

node src/excel-cli.js export --xml "%xml_file%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ 엑셀 파일이 성공적으로 생성되었습니다.
    echo 시작 시간: %start_time%
    echo 완료 시간: %time%
    echo.
) else (
    echo.
    echo ❌ 엑셀 파일 생성 중 오류가 발생했습니다.
)

echo.
pause
goto MENU

:EXPORT_JSON
echo.
echo =========================================
echo   엑셀 파일 생성 (JSON)
echo =========================================
echo.
echo 사용 가능한 JSON 쿼리문정의 파일들:
echo.
if exist "queries\*.json" (
    for %%f in (queries\*.json) do echo   - %%f
) else (
    echo   (JSON 파일이 없습니다)
)
echo.

echo JSON 파일 경로를 입력하세요 (예: queries/my-queries.json):
set /p json_file=
if "%json_file%"=="" (
    echo 파일 경로가 입력되지 않았습니다.
    echo.
    pause
    goto MENU
)

if not exist "%json_file%" (
    echo 파일을 찾을 수 없습니다: %json_file%
    echo.
    pause
    goto MENU
)

echo.
echo 엑셀 파일을 생성하고 있습니다...
echo.
:: Record start time
set start_time=%time%

node src/excel-cli.js export --query "%json_file%"

if %errorlevel% equ 0 (
    echo.
    echo ✅ 엑셀 파일이 성공적으로 생성되었습니다.
    echo 시작 시간: %start_time%
    echo 완료 시간: %time%
    echo.
    echo 생성된 파일을 확인하시겠습니까? (Y/N)
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
goto MENU

:ADVANCED
cls
echo.
echo =========================================
echo   고급 메뉴
echo =========================================
echo.
echo 1. 쿼리문정의 파일 편집
echo 2. DB 설정 파일 편집
echo 3. 출력 폴더 열기
echo 4. 프로젝트 정보
echo 0. 메인 메뉴로 돌아가기
echo =========================================
echo.
set /p adv_choice=선택하세요 (0-4): 

if "%adv_choice%"=="1" goto EDIT_QUERY
if "%adv_choice%"=="2" goto EDIT_CONFIG
if "%adv_choice%"=="3" goto OPEN_OUTPUT
if "%adv_choice%"=="4" goto PROJECT_INFO
if "%adv_choice%"=="0" goto MENU

echo 잘못된 선택입니다.
echo.
pause
goto ADVANCED

:EDIT_QUERY
echo.
echo =========================================
echo   쿼리문정의 파일 편집
echo =========================================
echo.
echo 편집할 파일을 선택하세요:
echo.
if exist "queries\*.xml" (
    echo [XML 파일들]
    for %%f in (queries\*.xml) do echo   - %%f
    echo.
)
if exist "queries\*.json" (
    echo [JSON 파일들]
    for %%f in (queries\*.json) do echo   - %%f
    echo.
)

echo 편집할 파일 경로를 입력하세요 (빈 값 입력 시 취소):
set /p edit_file=
if "%edit_file%"=="" goto ADVANCED

if exist "%edit_file%" (
    notepad "%edit_file%"
) else (
    echo 해당 파일을 찾을 수 없습니다: %edit_file%
    echo.
    pause
)
goto ADVANCED

:EDIT_CONFIG
echo.
echo =========================================
echo   DB 설정 파일 편집
echo =========================================
echo.
if exist "config\dbinfo.json" (
    notepad "config\dbinfo.json"
) else (
    echo config\dbinfo.json 파일이 없습니다.
    echo 샘플 파일을 생성하시겠습니까? (Y/N)
    set /p create_config=
    if /i "!create_config!"=="Y" (
        echo { > "config\dbinfo.json"
        echo   "sampleDB": { >> "config\dbinfo.json"
        echo     "host": "localhost", >> "config\dbinfo.json"
        echo     "port": 1433, >> "config\dbinfo.json"
        echo     "user": "sa", >> "config\dbinfo.json"
        echo     "password": "yourpassword", >> "config\dbinfo.json"
        echo     "database": "SampleDB" >> "config\dbinfo.json"
        echo   } >> "config\dbinfo.json"
        echo } >> "config\dbinfo.json"
        echo.
        echo config\dbinfo.json 파일이 생성되었습니다. 이제 편집하세요.
        notepad "config\dbinfo.json"
    )
)
echo.
pause
goto ADVANCED

:OPEN_OUTPUT
echo.
echo 출력 폴더를 열고 있습니다...
if not exist "output" mkdir output
explorer output
echo.
pause
goto ADVANCED

:PROJECT_INFO
echo.
echo =========================================
echo   프로젝트 정보
echo =========================================
echo.
echo 프로젝트명: SQL2Excel 도구
echo 버전: v1.2.0
echo 설명: SQL 쿼리 결과를 엑셀 파일로 저장하는 도구
echo.
echo 주요 기능:
echo - XML/JSON 쿼리 정의 파일 지원
echo - 쿼리 정의 재사용 기능 (v1.2)
echo - 멀티 데이터베이스 지원
echo - 변수 치환 기능
echo - 엑셀 스타일링 지원
echo.
echo Node.js 버전:
node --version
echo.
echo NPM 패키지 정보:
if exist "package.json" (
    echo package.json 파일이 있습니다.
    echo 자세한 정보를 보시겠습니까? (Y/N)
    set /p show_package=
    if /i "!show_package!"=="Y" (
        notepad package.json
    )
) else (
    echo package.json 파일이 없습니다.
)
echo.
pause
goto ADVANCED

:HELP
echo.
echo =========================================
echo   도움말
echo =========================================
echo.

node src/excel-cli.js help

echo.
echo 추가 정보:
echo - 쿼리 정의 재사용: v1.2부터 queryRef 속성으로 쿼리 재사용 가능
echo - XML 파일: queries/ 폴더에 XML 형식으로 쿼리 정의
echo - JSON 파일: queries/ 폴더에 JSON 형식으로 쿼리 정의
echo - 출력 파일: output/ 폴더에 엑셀 파일 생성
echo - DB 설정: config/dbinfo.json 파일에서 연결 정보 관리
echo.
echo 자세한 사용법은 README.md 파일을 참고하세요.
echo.
pause
goto MENU

:EXIT
echo.
echo 프로그램을 종료합니다.
echo.
pause
exit /b 0