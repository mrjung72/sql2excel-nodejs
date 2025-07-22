@echo off
REM sql2excel-nodejs 실행 배치파일 예시
REM 필요에 따라 아래 XML 파일명, 변수 등을 수정하세요.

set XML_FILE=queries\queries-sample.xml
set JSON_FILE=queries\queries-sample-orders.json

REM JSON 파일 실행
@REM node src\index.js -q %JSON_FILE% -c config\dbinfo.json

REM XML 파일 실행
node src\index.js -x %XML_FILE% -c config\dbinfo.json

pause 