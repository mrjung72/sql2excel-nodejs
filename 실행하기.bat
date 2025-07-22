@echo off
REM sql2excel-nodejs 실행 배치파일 예시
REM 필요에 따라 아래 XML 파일명, 변수 등을 수정하세요.

set XML_FILE=queries\queries-sample.xml
set JSON_FILE=queries\queries-sample-orders.json
set CONFIG_FILE=config\dbinfo.json
REM 쿼리파일(excel)에서 db/output 모두 지정 가능

REM 예시: 날짜 변수 추가
set VARS=-v startDate=2024-01-01 -v endDate=2024-06-30

REM JSON 파일 실행
@REM node src\index.js -q %JSON_FILE% -c %CONFIG_FILE% %VARS%

REM XML 파일 실행
node src\index.js -x %XML_FILE% -c %CONFIG_FILE% %VARS%

pause 