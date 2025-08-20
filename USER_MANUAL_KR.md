# SQL2Excel 도구 사용자 매뉴얼

## 📖 목차
- [개요](#개요)
- [설치 및 설정](#설치-및-설정)
- [기본 사용법](#기본-사용법)
- [쿼리 정의 파일 구조](#쿼리-정의-파일-구조)
- [고급 기능](#고급-기능)
- [CLI 명령어 참조](#cli-명령어-참조)
- [예시](#예시)
- [문제 해결](#문제-해결)

## 🎯 개요

SQL2Excel은 SQL 쿼리 결과를 엑셀 파일로 생성하는 Node.js 기반 도구입니다.

### 주요 기능
- 📊 **멀티 시트 지원**: 여러 SQL 쿼리 결과를 하나의 엑셀 파일에 시트별로 저장
- 🎨 **엑셀 스타일링**: 헤더/데이터 영역 각각 폰트, 색상, 테두리, 정렬 등 세부 스타일 설정
- 🔗 **다중 DB 연결**: 시트별로 다른 데이터베이스 연결 가능
- 📝 **변수 시스템**: 쿼리 내 변수 사용으로 동적 쿼리 생성
- 🔄 **쿼리 재사용**: 공통 쿼리 정의 후 여러 시트에서 재사용
- 📋 **자동 목차**: 목차 시트 자동 생성 및 하이퍼링크 제공
- 📊 **집계 기능**: 지정 컬럼의 값별 건수 자동 집계 및 표시
- 🚦 **조회 제한**: 대용량 데이터 처리를 위한 건수 제한 기능
- 🖥️ **CLI 인터페이스**: 명령줄 도구로 간편한 실행
- 🪟 **윈도우 배치 파일**: 윈도우 사용자를 위한 배치 파일 제공
- 📄 **XML/JSON 지원**: 유연한 설정 파일 형식 지원

## 🛠️ 설치 및 설정

### 1. 환경 요구사항
- Node.js 16.0 이상
- SQL Server 2012 이상
- 적절한 데이터베이스 권한

### 2. 설치
```bash
npm install
```

### 3. 데이터베이스 연결 설정
`config/dbinfo.json` 파일 생성:
```json
{
  "dbs": {
    "sampleDB": {
      "server": "localhost",
      "port": 1433,
      "database": "SampleDB",
      "user": "sa",
      "password": "yourpassword",
      "options": {
        "encrypt": false,
        "trustServerCertificate": true
      }
    },
    "erpDB": {
      "server": "erp-server.com",
      "port": 1433,
      "database": "ERP_Database",
      "user": "erp_user",
      "password": "erp_password",
      "options": {
        "encrypt": true,
        "trustServerCertificate": false
      }
    }
  }
}
```

## 🚀 기본 사용법

### CLI 명령어 실행

#### 1. 엑셀 파일 생성
```bash
# XML 쿼리 파일 사용
node src/excel-cli.js export --xml ./queries/sample-queries.xml

# JSON 쿼리 파일 사용
node src/excel-cli.js export --query ./queries/sample-queries.json

# 변수 지정하여 실행
node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"
```

#### 2. 쿼리 파일 검증
```bash
node src/excel-cli.js validate --xml ./queries/sample-queries.xml
```

#### 3. 데이터베이스 연결 테스트
```bash
node src/excel-cli.js list-dbs
```

### NPM 스크립트 사용
```bash
# 엑셀 내보내기
npm run export -- --xml ./queries/sample-queries.xml

# 쿼리 파일 검증
npm run validate -- --xml ./queries/sample-queries.xml

# DB 연결 테스트
npm run list-dbs

# 도움말
npm run help
```

### 윈도우 배치 파일 (편의 기능)
```bash
# 메인 메뉴 (인터랙티브)
실행하기.bat
sql2excel.bat

# 빠른 실행
export-xml.bat queries/my-queries.xml
export-json.bat queries/my-queries.json
validate.bat queries/my-queries.xml
db-test.bat
```

## 📄 쿼리 정의 파일 구조

### XML 형식 예시
```xml
<queries>
  <!-- 엑셀 파일 설정 -->
  <excel db="sampleDB" output="output/매출보고서_2024.xlsx">
    <header>
      <font name="맑은 고딕" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
      <alignment horizontal="center" vertical="middle"/>
      <border>
        <all style="thin" color="000000"/>
      </border>
      <colwidths min="10" max="30"/>
    </header>
    <body>
      <font name="맑은 고딕" size="11" color="000000" bold="false"/>
      <fill color="FFFFCC"/>
      <alignment horizontal="left" vertical="top"/>
      <border>
        <all style="thin" color="CCCCCC"/>
      </border>
    </body>
  </excel>
  
  <!-- 재사용 가능한 쿼리 정의 -->
  <queryDefs>
    <queryDef name="orders_by_date" description="기간별 주문 조회">
      <![CDATA[
        SELECT OrderID, CustomerName, OrderDate, TotalAmount, OrderStatus
        FROM Orders o
        JOIN Customers c ON o.CustomerID = c.CustomerID
        WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'
        ORDER BY OrderDate DESC
      ]]>
    </queryDef>
  </queryDefs>
  
  <!-- 변수 정의 -->
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
    <var name="targetRegion">서울</var>
  </vars>
  
  <!-- 시트 정의 -->
  <sheet name="주문목록_${startDate}" use="true" queryRef="orders_by_date" 
         aggregateColumn="OrderStatus" maxRows="1000" db="sampleDB"/>
  
  <sheet name="월별집계" use="true" aggregateColumn="Month" db="sampleDB">
    <![CDATA[
      SELECT 
        YEAR(OrderDate) as Year,
        MONTH(OrderDate) as Month,
        COUNT(*) as OrderCount,
        SUM(TotalAmount) as TotalSales
      FROM Orders 
      WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'
      GROUP BY YEAR(OrderDate), MONTH(OrderDate)
      ORDER BY Year, Month
    ]]>
  </sheet>
</queries>
```

### JSON 형식 예시
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/매출보고서_2024.xlsx",
    "header": {
      "font": { "name": "맑은 고딕", "size": 12, "color": "FFFFFF", "bold": true },
      "fill": { "color": "4F81BD" },
      "alignment": { "horizontal": "center", "vertical": "middle" },
      "border": { "all": { "style": "thin", "color": "000000" } },
      "colwidths": { "min": 10, "max": 30 }
    },
    "body": {
      "font": { "name": "맑은 고딕", "size": 11, "color": "000000", "bold": false },
      "fill": { "color": "FFFFCC" },
      "alignment": { "horizontal": "left", "vertical": "top" },
      "border": { "all": { "style": "thin", "color": "CCCCCC" } }
    }
  },
  "queryDefs": {
    "orders_by_date": {
      "description": "기간별 주문 조회",
      "query": "SELECT OrderID, CustomerName, OrderDate, TotalAmount, OrderStatus FROM Orders o JOIN Customers c ON o.CustomerID = c.CustomerID WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}' ORDER BY OrderDate DESC"
    }
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "targetRegion": "서울"
  },
  "sheets": [
    {
      "name": "주문목록_${startDate}",
      "use": true,
      "queryRef": "orders_by_date",
      "aggregateColumn": "OrderStatus",
      "maxRows": 1000,
      "db": "sampleDB"
    },
    {
      "name": "월별집계",
      "use": true,
      "aggregateColumn": "Month",
      "db": "sampleDB",
      "query": "SELECT YEAR(OrderDate) as Year, MONTH(OrderDate) as Month, COUNT(*) as OrderCount, SUM(TotalAmount) as TotalSales FROM Orders WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}' GROUP BY YEAR(OrderDate), MONTH(OrderDate) ORDER BY Year, Month"
    }
  ]
}
```

## 🚀 고급 기능

### 1. 쿼리 정의 재사용 (queryDefs)

공통 쿼리를 정의하고 여러 시트에서 재사용할 수 있습니다.

#### 장점
- **코드 재사용**: 동일한 쿼리를 여러 시트에서 사용
- **유지보수 효율성**: 한 곳에서 수정하면 모든 참조 시트에 적용
- **가독성 향상**: 복잡한 쿼리를 의미있는 이름으로 명명
- **일관성 보장**: 동일한 비즈니스 로직 일관 적용

#### 사용법
```xml
<!-- 1. 쿼리 정의 -->
<queryDefs>
  <queryDef name="sales_summary" description="매출 요약">
    <![CDATA[
      SELECT Region, SUM(Amount) as TotalSales, COUNT(*) as OrderCount
      FROM Sales WHERE SaleDate >= '${startDate}'
      GROUP BY Region ORDER BY TotalSales DESC
    ]]>
  </queryDef>
</queryDefs>

<!-- 2. 쿼리 참조 -->
<sheet name="지역별매출" queryRef="sales_summary" use="true"/>
<sheet name="매출분석" queryRef="sales_summary" use="true"/>
```

### 2. 자동 목차 시트 생성

모든 엑셀 파일에 자동으로 목차 시트가 생성됩니다.

#### 목차 시트 특징
- **하이퍼링크**: 시트명, 데이터 건수 클릭 시 해당 시트로 이동
- **집계 정보**: 지정된 컬럼의 값별 건수 표시
- **데이터 건수**: 천 단위 구분자로 표시
- **파란색 탭**: 목차 시트를 쉽게 구분

#### 집계 정보 표시 예시
```
[주문상태] Shipped:89, Processing:45, Cancelled:16 외 2개
[지역] 서울:34, 부산:21, 대구:15
```

### 3. 시트별 다중 DB 연결

각 시트마다 다른 데이터베이스에 연결할 수 있습니다.

#### 사용법
```xml
<excel db="mainDB">
  <!-- 기본 DB 설정 -->
</excel>

<sheet name="주문데이터" db="orderDB">
  <!-- orderDB에서 데이터 조회 -->
</sheet>

<sheet name="고객데이터" db="customerDB">
  <!-- customerDB에서 데이터 조회 -->
</sheet>

<sheet name="통계데이터">
  <!-- db 미지정 시 기본 DB(mainDB) 사용 -->
</sheet>
```

#### DB 출처 표시
각 시트 상단에 데이터 출처 DB가 자동으로 표시됩니다:
```
📊 데이터 출처: orderDB 데이터베이스
[빈 행]
[헤더 행]
[데이터 행들...]
```

### 4. 조회 건수 제한 (maxRows)

대용량 데이터 처리 시 시스템 부하를 줄이기 위해 조회 건수를 제한할 수 있습니다.

#### 사용법
```xml
<sheet name="대용량데이터" maxRows="5000">
  <![CDATA[
    SELECT * FROM LargeTable WHERE CreateDate >= '2024-01-01'
  ]]>
</sheet>
```

#### 작동 원리
- SQL 쿼리에 `TOP N` 절을 자동으로 추가
- 기존에 `TOP` 절이 있으면 maxRows 설정 무시
- 제한 적용 시 콘솔에 `[제한] 최대 N건으로 제한됨` 메시지 표시

### 5. 엑셀 스타일 커스터마이징

#### 지원하는 스타일 속성
| 카테고리 | 속성 | 설명 | 예시 |
|----------|------|------|------|
| **폰트** | name | 폰트명 | "맑은 고딕" |
| | size | 크기 | 12 |
| | color | 색상(ARGB) | "FFFFFF" |
| | bold | 굵게 | true/false |
| **배경** | color | 배경색(ARGB) | "4F81BD" |
| **정렬** | horizontal | 가로정렬 | "center", "left", "right" |
| | vertical | 세로정렬 | "top", "middle", "bottom" |
| **테두리** | all | 전체테두리 | {"style":"thin","color":"000000"} |
| | top/left/right/bottom | 방향별 | {"style":"thin","color":"000000"} |
| **컬럼너비** | min | 최소너비 | 10 |
| | max | 최대너비 | 30 |

### 6. 변수 시스템

#### 일반 변수 정의 및 사용
```xml
<!-- 변수 정의 -->
<vars>
  <var name="startDate">2024-01-01</var>
  <var name="endDate">2024-12-31</var>
  <var name="targetRegion">서울</var>
  <var name="regionList">["서울", "부산", "대구"]</var>
</vars>

<!-- 쿼리에서 변수 사용 -->
<sheet name="지역별매출_${targetRegion}">
  <![CDATA[
    SELECT * FROM Sales 
    WHERE Region = '${targetRegion}' 
      AND SaleDate >= '${startDate}' 
      AND SaleDate <= '${endDate}'
      AND Region IN (${regionList})
  ]]>
</sheet>
```

#### CLI에서 변수 덮어쓰기
```bash
node src/excel-cli.js export --xml queries.xml --var "startDate=2024-06-01" --var "endDate=2024-06-30"
```

### 7. 동적 변수 시스템

 #### 동적 변수 정의
 동적 변수는 데이터베이스에서 실시간으로 값을 조회하여 쿼리에 사용할 수 있는 고급 변수 시스템입니다.
 
 ```xml
 <!-- 동적 변수 정의 -->
 <dynamicVars>
   <!-- 기본 타입 (column_identified): type 속성 생략 시 기본값 -->
   <dynamicVar name="customerData" description="고객 데이터 컬럼별 분류">
     <![CDATA[
       SELECT CustomerID, CustomerName, City, Region
       FROM Customers WHERE IsActive = 1
     ]]>
   </dynamicVar>
   
   <!-- key_value_pairs 타입: 명시적으로 지정 필요 -->
   <dynamicVar name="productPrices" type="key_value_pairs" description="상품별 가격 정보">
     <![CDATA[
       SELECT ProductID, UnitPrice
       FROM Products WHERE Discontinued = 0
     ]]>
   </dynamicVar>
   
   <!-- 기본 타입 (column_identified): 각 컬럼별로 배열 생성 -->
   <dynamicVar name="activeCategories" description="활성 카테고리 목록">
     <![CDATA[
       SELECT CategoryID, CategoryName FROM Categories WHERE IsActive = 1
     ]]>
   </dynamicVar>
 </dynamicVars>
 ```

#### 동적 변수 사용 방법

 **1. 기본 타입 (column_identified) 사용**
 ```sql
 -- ${customerData.CustomerID} 형태로 특정 컬럼의 값들만 사용
 SELECT * FROM Orders 
 WHERE CustomerID IN (${customerData.CustomerID})
   AND Region IN (${customerData.Region})
 
 -- ${activeCategories.CategoryID} 형태로 특정 컬럼 사용
 SELECT * FROM Products 
 WHERE CategoryID IN (${activeCategories.CategoryID})
 ```
 
 **2. key_value_pairs 타입 사용**
 ```sql
 -- ${productPrices.ProductID} 형태로 키 값들만 사용
 SELECT * FROM OrderDetails 
 WHERE ProductID IN (${productPrices.ProductID})
 ```

#### 동적 변수 타입별 특징

 | 타입 | 설명 | 사용법 | 예시 |
 |------|------|--------|------|
 | 기본 (없음) | 각 컬럼별로 배열 생성 (column_identified 동작) | `${변수명.컬럼명}` | `${customerData.CustomerID}` |
 | `key_value_pairs` | 키-값 쌍으로 생성 (명시적 지정 필요) | `${변수명.키명}` | `${productPrices.ProductID}` |

 #### 시각 함수와 조합 사용
 ```xml
 <!-- 기본 타입으로 다중 컬럼 동적 변수 -->
 <dynamicVar name="recentOrders" description="최근 주문 정보">
   <![CDATA[
     SELECT OrderID, OrderNumber, OrderDate
     FROM Orders 
     WHERE OrderDate >= '${startDate}' 
       AND OrderDate <= '${endDate}'
       AND OrderDate >= DATEADD(day, -30, '${CURRENT_DATE}')
   ]]>
 </dynamicVar>
 ```
 
 **사용 예시:**
 ```sql
 -- 최근 주문 ID들로 필터링
 SELECT * FROM OrderDetails 
 WHERE OrderID IN (${recentOrders.OrderID})
 
 -- 최근 주문 번호들로 검색
 SELECT * FROM Shipments 
 WHERE OrderNumber IN (${recentOrders.OrderNumber})
 ```

## 📋 CLI 명령어 참조

### 1. export - 엑셀 파일 생성
```bash
node src/excel-cli.js export [옵션]
```

#### 옵션
| 옵션 | 단축형 | 설명 | 예시 |
|------|--------|------|------|
| `--xml` | `-x` | XML 쿼리 파일 경로 | `--xml ./queries/sample.xml` |
| `--query` | `-q` | JSON 쿼리 파일 경로 | `--query ./queries/sample.json` |
| `--config` | `-c` | DB 설정 파일 경로 | `--config ./config/custom.json` |
| `--var` | `-v` | 쿼리 변수 설정 (복수 가능) | `--var "year=2024" --var "dept=IT"` |

### 2. validate - 쿼리 파일 검증
```bash
node src/excel-cli.js validate --xml ./queries/sample.xml
```

### 3. list-dbs - DB 연결 테스트
```bash
node src/excel-cli.js list-dbs
```

### 4. help - 도움말
```bash
node src/excel-cli.js help
```

## 📊 예시

### 1. 기본 매출 보고서
```bash
# 샘플 XML 파일로 매출 보고서 생성
node src/excel-cli.js export --xml ./queries/queries-sample.xml

# 또는 윈도우 배치 파일 사용
test-sample-xml.bat
```

### 2. 주문 관리 보고서
```bash
# 주문 관리용 JSON 설정으로 10개 시트 보고서 생성
node src/excel-cli.js export --query ./queries/queries-sample-orders.json

# 또는 윈도우 배치 파일 사용
test-sample-orders.bat
```

### 3. 변수를 사용한 기간별 보고서
```bash
# 2024년 상반기 데이터로 보고서 생성
node src/excel-cli.js export --xml ./queries/sales-report.xml \
  --var "startDate=2024-01-01" \
  --var "endDate=2024-06-30" \
  --var "year=2024"
```

### 4. 사용자 정의 DB 설정
```bash
# 운영 DB 설정 파일로 보고서 생성
node src/excel-cli.js export --xml ./queries/monthly-report.xml \
  --config ./config/production-db.json
```

## 🔧 문제 해결

### 1. 데이터베이스 연결 오류
```bash
# DB 연결 테스트로 문제 확인
node src/excel-cli.js list-dbs
```

**일반적인 해결책:**
- `config/dbinfo.json` 파일의 연결 정보 확인
- SQL Server 서비스 실행 상태 확인
- 방화벽 및 포트(1433) 개방 상태 확인
- 사용자 권한 확인

### 2. 쿼리 파일 형식 오류
```bash
# 쿼리 파일 검증으로 문제 확인
node src/excel-cli.js validate --xml ./queries/problematic.xml
```

**일반적인 해결책:**
- XML/JSON 형식 문법 오류 수정
- 필수 속성(`name`, `use` 등) 누락 확인
- CDATA 섹션 올바른 사용 확인

### 3. 메모리 부족 오류
**해결책:**
- `maxRows` 속성으로 조회 건수 제한
- 시트를 더 작은 단위로 분할
- Node.js 메모리 제한 증가: `node --max-old-space-size=4096`

### 4. 엑셀 파일 생성 실패
**해결책:**
- `output` 폴더 쓰기 권한 확인
- 파일 경로의 폴더가 존재하는지 확인 (자동 생성됨)
- 동일한 이름의 파일이 다른 프로그램에서 열려있지 않은지 확인

### 로그 파일 위치
- 실행 로그: 콘솔 출력
- 오류 정보: 에러 메시지와 함께 콘솔 출력

### 버전 확인
```bash
node src/excel-cli.js --version
```

### 도움말
```bash
node src/excel-cli.js help
```

## 📞 지원
- Site Url: sql2excel.com 
- Contact: sql2excel.nodejs@gmail.com

---

**📝 버전**: v1.2.2
**📅 최종 업데이트**: 2025-08-20
**🔧 주요 기능**: 멀티시트 엑셀 생성, 스타일링, 다중 DB 연결, 쿼리 재사용, 자동 목차
