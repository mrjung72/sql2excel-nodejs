@echo off
chcp 65001 > nul
color 0F

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                   XML vs JSON 스타일 비교 테스트                  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo XML과 JSON 설정파일에서 스타일이 동일하게 적용되는지 비교 테스트합니다.
echo.

:: output 디렉토리 생성
if not exist "output" mkdir output

echo ========================================
echo 1단계: JSON 설정파일로 엑셀 생성
echo ========================================
echo.
echo 📊 JSON 주문관리 보고서 생성 중...
node src/index.js -q resources/queries-sample-orders.json

if %errorlevel% neq 0 (
    echo ❌ JSON 파일 생성 실패
    goto :error
)

echo ✅ JSON 파일 생성 완료
echo.

echo ========================================
echo 2단계: XML 설정파일로 엑셀 생성  
echo ========================================
echo.
echo 📊 XML 매출집계 보고서 생성 중...
node src/index.js -x resources/queries-sample.xml

if %errorlevel% neq 0 (
    echo ❌ XML 파일 생성 실패
    goto :error
)

echo ✅ XML 파일 생성 완료
echo.

echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                        비교 테스트 완료!                          ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo 📁 생성된 파일들:
echo.
echo 🔵 JSON 파일:
echo    - 주문관리_보고서_yyyymmddhhmmss.xlsx (10개 시트)
echo    - 주문관리_보고서_목차_yyyymmddhhmmss.xlsx
echo.
echo 🔴 XML 파일:
echo    - 매출집계_2024_yyyymmddhhmmss.xlsx (3개 시트)
echo    - 매출집계_2024_목차_yyyymmddhhmmss.xlsx
echo.
echo 🎨 스타일 비교 확인 사항:
echo.
echo ✓ 헤더 스타일:
echo   - 폰트: 맑은 고딕 12px 굵게
echo   - 배경: 파란색 (#4F81BD)
echo   - 글자: 흰색 (#FFFFFF)
echo   - 정렬: 중앙정렬
echo   - 테두리: 검은색 얇은선
echo.
echo ✓ 데이터 스타일:
echo   - 폰트: 맑은 고딕 11px 일반
echo   - 배경: 노란색 (#FFFFCC)
echo   - 글자: 검은색 (#000000)
echo   - 정렬: 좌측정렬 (JSON), 좌측정렬 (XML)
echo   - 테두리: 회색 얇은선 (#CCCCCC)
echo.
echo ✓ 컬럼 너비:
echo   - 자동 계산 (최소 10, 최대 30)
echo.
echo 💡 두 파일을 열어서 스타일이 동일한지 확인해보세요!
echo.

echo output 폴더를 열까요? (Y/N)
set /p open_folder=
if /i "%open_folder%"=="Y" (
    explorer "output"
)

goto :end

:error
echo.
echo ❌ 파일 생성에 실패했습니다.
echo.
echo 확인 사항:
echo   1. SQL Server에 SampleDB가 존재하는지 확인
echo   2. Customers, Orders, OrderDetails 테이블이 있는지 확인
echo   3. resources/config.json의 DB 연결정보 확인
echo.
echo 해결 방법:
echo   1. resources/create_sample_tables.sql 실행
echo   2. resources/insert_sample_data.sql 실행
echo.

:end
echo.
pause 