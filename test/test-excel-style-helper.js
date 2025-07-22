const ExcelJS = require('exceljs');
const excelStyleHelper = require('../src/excel-style-helper');

/**
 * Excel 스타일 헬퍼 모듈 테스트
 */
(async () => {
  console.log('Excel Style Helper 모듈 테스트를 시작합니다...');

  // 테스트 데이터
  const testData = [
    { id: 1, name: '홍길동', email: 'hong@example.com', department: '개발팀' },
    { id: 2, name: '김영희', email: 'kim@example.com', department: '마케팅팀' },
    { id: 3, name: '이철수', email: 'lee@example.com', department: '영업팀' },
    { id: 4, name: '박민수', email: 'park@example.com', department: '인사팀' },
    { id: 5, name: '정수진', email: 'jung@example.com', department: '재무팀' }
  ];

  // 테스트 스타일 설정
  const testStyle = {
    header: {
      font: { 
        name: '맑은 고딕', 
        size: 12, 
        color: 'FFFFFF', 
        bold: true 
      },
      fill: { 
        color: '4F81BD' 
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'middle' 
      },
      border: {
        all: { 
          style: 'thin', 
          color: '000000' 
        }
      },
      colwidths: { 
        min: 8, 
        max: 25 
      }
    },
    body: {
      font: { 
        name: '맑은 고딕', 
        size: 11, 
        color: '000000', 
        bold: false 
      },
      fill: { 
        color: 'FFFFCC' 
      },
      alignment: { 
        horizontal: 'left', 
        vertical: 'middle' 
      },
      border: {
        all: { 
          style: 'thin', 
          color: 'CCCCCC' 
        }
      }
    }
  };

  try {
    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    
    console.log('1. 기본 시트 스타일 테스트...');
    const sheet1 = workbook.addWorksheet('기본 스타일 테스트');
    excelStyleHelper.applySheetStyle(sheet1, testData, testStyle);
    console.log('✅ 기본 스타일 적용 완료');

    console.log('2. 컬럼 너비 계산 테스트...');
    const columns = Object.keys(testData[0]);
    const calculatedWidths = excelStyleHelper.calculateColumnWidths(
      columns, 
      testData, 
      { min: 10, max: 30 }
    );
    console.log('계산된 컬럼 너비:', calculatedWidths);
    console.log('✅ 컬럼 너비 계산 완료');

    console.log('3. 개별 스타일 함수 테스트...');
    const sheet2 = workbook.addWorksheet('개별 함수 테스트');
    
    // 기본 컬럼 설정
    sheet2.columns = columns.map(key => ({ header: key, key }));
    sheet2.addRows(testData);
    
    // 개별 함수로 스타일 적용
    excelStyleHelper.applyHeaderStyle(sheet2, columns, testStyle.header);
    excelStyleHelper.applyBodyStyle(sheet2, columns, testData.length, testStyle.body);
    console.log('✅ 개별 스타일 함수 적용 완료');

    console.log('4. border 파싱 테스트...');
    const borderTest = {
      all: { style: 'thick', color: 'FF0000' }
    };
    const parsedBorder = excelStyleHelper.parseBorder(borderTest);
    console.log('파싱된 테두리:', JSON.stringify(parsedBorder, null, 2));
    console.log('✅ 테두리 파싱 완료');

    console.log('5. font 파싱 테스트...');
    const fontTest = {
      name: '돋움', 
      size: '14', 
      color: '0000FF', 
      bold: 'true'
    };
    const parsedFont = excelStyleHelper.parseFont(fontTest);
    console.log('파싱된 폰트:', JSON.stringify(parsedFont, null, 2));
    console.log('✅ 폰트 파싱 완료');

    console.log('6. fill 파싱 테스트...');
    const fillTest = { color: '00FF00' };
    const parsedFill = excelStyleHelper.parseFill(fillTest);
    console.log('파싱된 채우기:', JSON.stringify(parsedFill, null, 2));
    console.log('✅ 채우기 파싱 완료');

    console.log('7. alignment 파싱 테스트...');
    const alignmentTest = { horizontal: 'right', vertical: 'top' };
    const parsedAlignment = excelStyleHelper.parseAlignment(alignmentTest);
    console.log('파싱된 정렬:', JSON.stringify(parsedAlignment, null, 2));
    console.log('✅ 정렬 파싱 완료');

    console.log('8. 목차 시트 생성 테스트...');
    const sheetNames = [
      { displayName: '기본 스타일 테스트', tabName: '기본 스타일 테스트' },
      { displayName: '개별 함수 테스트', tabName: '개별 함수 테스트' }
    ];
    excelStyleHelper.createTableOfContents(workbook, sheetNames);
    console.log('✅ 목차 시트 생성 완료');

    // 워크시트 순서 조정 (목차를 첫 번째로)
    const tocSheet = workbook.getWorksheet('목차');
    if (tocSheet) {
      workbook.worksheets = [tocSheet, ...workbook.worksheets.filter(ws => ws.name !== '목차')];
    }

    // 파일 저장
    const fileName = 'test-excel-style-helper-output.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`\n🎉 모든 테스트 완료! 결과 파일: ${fileName}`);
    console.log('\n📋 테스트 결과:');
    console.log('- 기본 시트 스타일 적용: ✅');
    console.log('- 컬럼 너비 자동 계산: ✅');
    console.log('- 개별 스타일 함수: ✅');
    console.log('- 스타일 파싱 함수들: ✅');
    console.log('- 목차 시트 생성: ✅');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
})(); 