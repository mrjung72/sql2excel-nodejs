@echo off
chcp 65001 > nul
color 0F

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                   시트명 잘림 처리 테스트                         ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo 31자 초과 시트명의 잘림 처리와 목차 링크를 테스트합니다.
echo.

:: output 디렉토리 생성
if not exist "output" mkdir output

echo 📊 시트명 길이 확인:
echo.
echo 시트명 1: "주문_목록_2024년도_월별현황" (24자) - 정상
echo 시트명 2: "고객_목록_상세정보_지역별_통계_분석결과_요약테이블_최종버전" (32자) - 잘림
echo 시트명 3: "주문_상세_데이터_년도별_분기별_월별_상세분석_통계보고서_최종본" (35자) - 잘림
echo 시트명 4: "매출데이터_종합분석_리포트_2024년도_상반기_하반기_통합_최종_검토완료_버전_v2.1_Final" (50자 이상) - 크게 잘림
echo.

echo 📋 테스트 실행 중...
echo.

:: 긴 시트명 테스트
node src/index.js -x resources/queries-sample-long.xml -c config/dbinfo.json

if %errorlevel% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════════╗
    echo ║                  시트명 잘림 테스트 완료!                         ║
    echo ╚══════════════════════════════════════════════════════════════════╝
    echo.
    echo 📁 생성된 파일:
    echo    - 매출집계_긴시트명테스트_2024_yyyymmddhhmmss.xlsx
    echo    - 매출집계_긴시트명테스트_2024_목차_yyyymmddhhmmss.xlsx
    echo.
    echo 🔍 확인 방법:
    echo.
    echo 【시트 탭 확인】
    echo 1. 메인 엑셀 파일 열기
    echo 2. 시트 탭들의 이름 확인 (31자로 잘린 이름들)
    echo 3. 목차 시트가 맨 왼쪽에 파란색으로 표시됨
    echo.
    echo 【목차 확인】
    echo 1. '목차' 시트 클릭
    echo 2. 'Note' 컬럼에 "(31자 초과로 잘림)" 표시 확인
    echo 3. 시트명에 마우스 오버 시 주석으로 원본명/실제명 표시
    echo 4. 시트명 링크 클릭하여 해당 시트로 이동 테스트
    echo.
    echo 📊 시트명 처리 결과:
    echo.
    echo 【정상 시트 (31자 이하)】
    echo    ✓ 원본명 그대로 유지
    echo    ✓ Note 컬럼 공백
    echo    ✓ 주석 없음
    echo.
    echo 【잘린 시트 (31자 초과)】
    echo    ⚠ 31자까지만 표시
    echo    ⚠ Note 컬럼에 경고 메시지
    echo    ⚠ 주석에 원본명/실제명 정보
    echo    ✓ 링크는 실제 시트명으로 정상 작동
    echo.
    echo 🔧 기술적 구현:
    echo.
    echo 【시트 생성 시】
    echo    1. ExcelJS의 addWorksheet() 호출
    echo    2. 실제 생성된 시트명 가져오기 (sheet.name)
    echo    3. 원본명과 실제명 비교하여 잘림 여부 판단
    echo    4. createdSheetNames에 originalName, tabName 저장
    echo.
    echo 【목차 생성 시】
    echo    1. tabName (실제 시트명)으로 하이퍼링크 생성
    echo    2. 잘림 시 Note 컬럼에 경고 표시
    echo    3. 셀 주석으로 상세 정보 제공
    echo    4. 주황색 폰트로 시각적 구분
    echo.
    echo 💡 Excel 시트명 제한:
    echo    - 최대 31자까지 허용
    echo    - 31자 초과 시 자동 잘림
    echo    - 잘린 이름으로 탭 표시
    echo    - 하이퍼링크는 잘린 이름 사용해야 함
    echo.

    echo output 폴더를 열까요? (Y/N)
    set /p open_folder=
    if /i "%open_folder%"=="Y" (
        explorer "output"
    )
) else (
    echo.
    echo ❌ 테스트 실행에 실패했습니다.
    echo.
    echo 가능한 원인:
    echo   1. 데이터베이스 연결 실패 (sampleDB)
    echo   2. config/dbinfo.json 파일 없음
    echo   3. 샘플 테이블이 생성되지 않음
    echo.
    echo 해결 방법:
    echo   1. 기존 작동하는 샘플로 대신 테스트
    echo   2. 수동으로 긴 시트명을 가진 Excel 파일 생성
    echo   3. ExcelJS 시트명 제한 동작 확인
    echo.
    echo 대안 테스트:
    echo   test-sample-xml.bat (기존 샘플로 기본 기능 확인)
    echo.
)

echo.
echo 🔄 다른 테스트:
echo    - test-toc-links.bat     : 목차 링크 기능 테스트
echo    - test-sheet-order.bat   : 시트 순서 테스트
echo    - test-sample-xml.bat    : 기본 기능 테스트
echo.
pause 