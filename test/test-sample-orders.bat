@echo off
chcp 65001 > nul
color 0F

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                   주문관리 보고서 생성 테스트                     ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo 샘플 Orders/Customers 데이터를 사용한 엑셀 파일 생성을 시작합니다...
echo.

:: output 디렉토리 생성
if not exist "output" mkdir output

echo 📊 주문관리 보고서 생성 중...
echo.
echo 포함되는 시트:
echo   ✓ 전체_고객_목록
echo   ✓ 활성_고객_목록  
echo   ✓ 주요지역_고객
echo   ✓ 전체_주문_목록
echo   ✓ 기간별_주문
echo   ✓ 처리중_주문
echo   ✓ 주문_상세_내역
echo   ✓ 고객별_주문_집계
echo   ✓ 월별_매출_집계
echo   ✓ 지역별_매출_분석
echo   ✓ 목차 시트
echo.

:: 엑셀 파일 생성 실행
node src/index.js -q resources/queries-sample-orders.json

if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                        생성 완료!                               ║
    echo ╚══════════════════════════════════════════════════════════════════╝
    echo.
    echo 📁 생성된 파일:
    echo    - 주문관리_보고서_2024-12-30_yyyymmddhhmmss.xlsx
    echo    - 주문관리_보고서_2024-12-30_목차_yyyymmddhhmmss.xlsx
    echo.
    echo 📋 파일 내용:
    echo    ▶ 고객 관련: 전체/활성/주요지역 고객 목록
    echo    ▶ 주문 관련: 전체/기간별/처리중 주문 정보
    echo    ▶ 상세 분석: 고객별/월별/지역별 집계 분석
    echo    ▶ 스타일링: 헤더(파란배경/흰글자), 본문(노란배경/검은글자)
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
    echo   2. SampleDB 데이터베이스가 존재하지 않음
    echo   3. Customers, Orders, OrderDetails 테이블이 존재하지 않음
    echo.
    echo 해결 방법:
    echo   1. SQL Server Management Studio에서 다음 스크립트를 순서대로 실행:
    echo      - resources/create_sample_tables.sql
    echo      - resources/insert_sample_data.sql
    echo   2. resources/config.json에서 DB 연결정보 확인
    echo.
)

echo.
pause 