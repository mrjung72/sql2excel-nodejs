@echo off
chcp 65001 > nul
color 0F

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    목차 링크 기능 테스트                          ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo 목차 시트의 하이퍼링크 기능을 테스트합니다.
echo.

:: output 디렉토리 생성
if not exist "output" mkdir output

echo 📊 목차 링크 테스트용 엑셀 생성 중...
echo.

:: 한글 시트명이 포함된 XML 파일로 테스트
node src/index.js -x resources/queries-sample.xml

if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                      목차 링크 테스트 완료!                        ║
    echo ╚══════════════════════════════════════════════════════════════════╝
    echo.
    echo 📁 생성된 파일:
    echo    1. 매출집계_2024_yyyymmddhhmmss.xlsx    (메인 데이터 파일)
    echo    2. 매출집계_2024_목차_yyyymmddhhmmss.xlsx (별도 목차 파일)
    echo.
    echo 🔗 목차 링크 확인 방법:
    echo.
    echo 【메인 파일 내 목차】
    echo 1. 매출집계_2024_xxx.xlsx 파일을 Excel에서 열기
    echo 2. '목차' 시트 탭 클릭
    echo 3. Sheet Name 컬럼의 파란색 링크 클릭
    echo 4. 해당 시트로 바로 이동됨 ✓
    echo.
    echo 【별도 목차 파일】
    echo 1. 매출집계_2024_목차_xxx.xlsx 파일을 Excel에서 열기
    echo 2. '📂 파일 열기' 링크 클릭
    echo 3. 메인 파일이 자동으로 열림
    echo 4. 메인 파일에서 원하는 시트 탭 클릭
    echo.
    echo 📋 테스트 대상 시트:
    echo    ✓ 주문_목록 (한글 + 언더스코어)
    echo    ✓ 고객_목록 (한글 + 언더스코어)  
    echo    ✓ 주문_상세 (한글 + 언더스코어)
    echo.
    echo 🔧 링크 작동 원리:
    echo.
    echo 【메인 파일 내부 링크】
    echo    - HYPERLINK 함수: =HYPERLINK("#'시트명'!A1","표시텍스트")
    echo    - 시트명 이스케이프: ' → ''
    echo    - 표시텍스트 이스케이프: " → ""
    echo.
    echo 【별도 파일 외부 링크】
    echo    - 파일 링크: =HYPERLINK("파일경로","📂 파일 열기")
    echo    - 상대/절대 경로 지원
    echo    - 사용법 안내 포함
    echo.
    echo 💡 문제 해결:
    echo.
    echo 【링크가 작동하지 않는 경우】
    echo    1. Excel에서 '편집 모드 사용' 확인
    echo    2. 매크로 보안 설정 확인 (파일 → 옵션 → 보안 센터)
    echo    3. 파일이 신뢰할 수 있는 위치에 있는지 확인
    echo    4. 파일 경로에 특수문자가 없는지 확인
    echo.
    echo 【별도 목차 파일 링크 실패 시】
    echo    1. 두 파일이 같은 폴더에 있는지 확인
    echo    2. 메인 파일명이 변경되지 않았는지 확인
    echo    3. 수동으로 메인 파일을 열고 시트 탭 클릭
    echo.

    echo output 폴더를 열까요? (Y/N)
    set /p open_folder=
    if /i "%open_folder%"=="Y" (
        explorer "output"
    )
) else (
    echo.
    echo ❌ 엑셀 파일 생성에 실패했습니다.
    echo.
    echo 가능한 원인:
    echo   1. 데이터베이스 연결 실패
    echo   2. SampleDB가 존재하지 않음
    echo   3. 샘플 테이블이 생성되지 않음
    echo.
    echo 해결 방법:
    echo   1. resources/create_sample_tables.sql 실행
    echo   2. resources/insert_sample_data.sql 실행
    echo   3. resources/config.json DB 연결정보 확인
    echo.
)

echo.
echo 🔄 다른 테스트:
echo    - test-sample-orders.bat : JSON 파일로 대용량 테스트 (10개 시트)
echo    - compare-xml-json.bat   : XML vs JSON 비교 테스트
echo.
pause 