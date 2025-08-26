const ExcelJS = require('exceljs');
const path = require('path');

// excel-style-helper 모듈 로드
const excelStyleHelper = require('../src/excel-style-helper');

(async () => {
  console.log('🔍 ToC 시트 쿼리문 표시 테스트');
  console.log('=====================================');

  try {
    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    
    // 목차 시트 생성
    const tocSheet = workbook.addWorksheet('목차');
    
    // 테스트용 시트 정보 (쿼리문 포함)
    const sheetNames = [
      { 
        displayName: '고객_목록', 
        originalName: '고객_목록',
        tabName: '고객_목록',
        recordCount: 150,
        aggregateColumn: '지역',
        aggregateData: [
          { key: '서울', count: 45 },
          { key: '부산', count: 32 },
          { key: '대구', count: 28 },
          { key: '인천', count: 25 }
        ],
        query: 'SELECT CustomerCode as 고객코드, CustomerName as 고객명, ContactName as 담당자명, City as 도시, Region as 지역, CustomerType as 고객유형, FORMAT(CreditLimit, \'N0\') as 신용한도 FROM SampleDB.dbo.Customers WHERE IsActive = 1 ORDER BY CreditLimit DESC'
      },
      { 
        displayName: '주문_목록', 
        originalName: '주문_목록',
        tabName: '주문_목록',
        recordCount: 89,
        aggregateColumn: '결제방법',
        aggregateData: [
          { key: '신용카드', count: 35 },
          { key: '현금', count: 28 },
          { key: '계좌이체', count: 26 }
        ],
        query: 'SELECT OrderNumber as 주문번호, FORMAT(OrderDate, \'yyyy-MM-dd\') as 주문일, OrderStatus as 주문상태, PaymentStatus as 결제상태, FORMAT(TotalAmount, \'N0\') as 총금액, PaymentMethod as 결제방법 FROM SampleDB.dbo.Orders WHERE OrderDate >= \'2024-01-01\' AND OrderDate <= \'2024-12-31\' ORDER BY OrderDate DESC'
      },
      { 
        displayName: '복잡한_쿼리_테스트', 
        originalName: '복잡한_쿼리_테스트',
        tabName: '복잡한_쿼리_테스트',
        recordCount: 67,
        aggregateColumn: '카테고리',
        aggregateData: [
          { key: '전자제품', count: 25 },
          { key: '의류', count: 22 },
          { key: '식품', count: 20 }
        ],
        query: 'SELECT p.ProductID as 상품ID, p.ProductName as 상품명, c.CategoryName as 카테고리, FORMAT(p.UnitPrice, \'N0\') as 단가, p.UnitsInStock as 재고수량, p.Discontinued as 단종여부, CASE WHEN p.UnitsInStock > 100 THEN \'충분\' WHEN p.UnitsInStock > 50 THEN \'보통\' ELSE \'부족\' END as 재고상태 FROM SampleDB.dbo.Products p INNER JOIN SampleDB.dbo.Categories c ON p.CategoryID = c.CategoryID WHERE p.Discontinued = 0 ORDER BY c.CategoryName, p.ProductName'
      }
    ];
    
    console.log('📋 ToC 시트에 쿼리문 정보 추가 중...');
    
    // ToC 시트에 내용 채우기 (쿼리문 포함)
    excelStyleHelper.populateTableOfContents(tocSheet, sheetNames);
    
    console.log('✅ ToC 시트 생성 완료');
    console.log(`   - 총 ${sheetNames.length}개 시트 정보`);
    console.log('   - 쿼리문 컬럼 포함');
    console.log('   - 집계 정보 포함');
    
    // 파일 저장
    const fileName = 'test-toc-with-query.xlsx';
    await workbook.xlsx.writeFile(fileName);
    console.log(`\n🎉 테스트 완료! 결과 파일: ${fileName}`);
    console.log('\n📋 ToC 시트 구성:');
    console.log('- No: 시트 번호');
    console.log('- Sheet Name: 시트명 (하이퍼링크)');
    console.log('- Records: 데이터 건수 (하이퍼링크)');
    console.log('- Aggregate Info: 집계 정보 (하이퍼링크)');
    console.log('- Query: 사용된 쿼리문 (최대 100자)');
    console.log('- Note: 비고사항');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    process.exit(1);
  }
})();
