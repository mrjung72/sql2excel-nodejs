# SQL2Excel 도구 사용자 매뉴얼

## 📖 목차
- [개요](#개요)
- [설치 및 설정](#설치-및-설정)
- [기본 사용법](#기본-사용법)
- [쿼리 정의 파일 구조](#쿼리-정의-파일-구조)
- [고급 기능](#고급-기능)
- [템플릿 스타일 시스템](#템플릿-스타일-시스템)
- [CLI 명령어 참조](#cli-명령어-참조)
- [예제](#예제)
- [문제 해결](#문제-해결)

## 🎯 개요

SQL2Excel은 SQL 쿼리 결과를 Excel 파일로 생성하는 Node.js 기반 도구로, 고급 스타일링과 템플릿 지원 기능을 제공합니다.

### 주요 기능
- 📊 **멀티 시트 지원**: 하나의 Excel 파일에 여러 SQL 쿼리 결과를 별도 시트로 저장
- 🎨 **템플릿 스타일 시스템**: 일관된 디자인을 위한 사전 정의된 Excel 스타일링 템플릿
- 🔗 **다중 DB 연결**: 각 시트마다 다른 데이터베이스 연결 사용
- 📝 **변수 시스템**: 동적 쿼리 생성을 위한 쿼리 내 변수 사용
- 🔄 **향상된 동적 변수**: 실시간 데이터베이스에서 값을 추출하여 고급 처리
- 🔄 **쿼리 재사용**: 공통 쿼리를 정의하고 여러 시트에서 재사용
- 📋 **자동 목차**: 하이퍼링크가 포함된 목차 시트 자동 생성
- 📋 **별도 목차 생성**: 독립적인 목차 Excel 파일 생성
- 📊 **집계 기능**: 지정된 컬럼 값별 자동 집계 및 표시
- 🚦 **쿼리 제한**: 대용량 데이터 처리를 위한 행 수 제한
- 🖥️ **CLI 인터페이스**: 간단한 명령줄 도구 실행
- 🪟 **Windows 배치 파일**: Windows 사용자를 위한 배치 파일
- 📄 **XML/JSON 지원**: 유연한 설정 파일 형식 지원
- 🔍 **파일 검증**: 자동 파일명 검증 및 한글 문자 경고
- 🎯 **시트별 스타일링**: 개별 시트에 다른 스타일 적용

## 🛠️ 설치 및 설정

### 1. 시스템 요구사항
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

#### 1. Excel 파일 생성
```bash
# XML 쿼리 파일 사용
node src/excel-cli.js export --xml ./queries/sample-queries.xml

# JSON 쿼리 파일 사용
node src/excel-cli.js export --query ./queries/sample-queries.json

# 변수와 함께 실행
node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

# 템플릿 스타일 사용
node src/excel-cli.js export --xml ./queries/sample-queries.xml --style modern

# 별도 목차 파일 생성
node src/excel-cli.js export --xml ./queries/sample-queries.xml --separate-toc
```

#### 2. 쿼리 파일 검증
```bash
node src/excel-cli.js validate --xml ./queries/sample-queries.xml
```

#### 3. 데이터베이스 연결 테스트
```bash
node src/excel-cli.js list-dbs
```

#### 4. 사용 가능한 템플릿 스타일 목록
```bash
node src/excel-cli.js list-styles
```

### NPM 스크립트 사용법
```bash
# Excel로 내보내기
npm run export -- --xml ./queries/sample-queries.xml

# 설정 검증
npm run validate -- --xml ./queries/sample-queries.xml

# 데이터베이스 연결 테스트
npm run test-db
```

### Windows 배치 파일
```bash
# Excel로 내보내기
export-xml.bat queries\sample-queries.xml

# JSON으로 내보내기
export-json.bat queries\sample-queries.json

# 설정 검증
validate.bat queries\sample-queries.xml

# 데이터베이스 연결 테스트
db-test.bat
```

## 📋 쿼리 정의 파일 구조

### XML 형식

#### 기본 구조
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries separateToc="true" maxRows="10000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="modern" separateToc="true">
    <header>
      <font name="Arial" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
      <colwidths min="20" max="50"/>
      <alignment horizontal="center" vertical="middle"/>
      <border>
        <all style="thin" color="000000"/>
      </border>
    </header>
    <body>
      <font name="Arial" size="11" color="000000" bold="false"/>
      <fill color="FFFFCC"/>
      <alignment horizontal="left" vertical="middle"/>
      <border>
        <all style="thin" color="CCCCCC"/>
      </border>
    </body>
  </excel>
  
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
    <var name="year">2024</var>
  </vars>
  
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="활성 고객 목록">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region FROM Customers WHERE IsActive = 1
      ]]>
    </dynamicVar>
    <dynamicVar name="productPrices" type="key_value_pairs" description="제품 가격">
      <![CDATA[
        SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <queryDefs>
    <queryDef id="customer_base" description="기본 고객 쿼리">
      <![CDATA[
        SELECT CustomerID, CustomerName, Email, Phone
        FROM Customers WHERE IsActive = 1
      ]]>
    </queryDef>
  </queryDefs>
  
  <sheets>
    <sheet name="MonthlySales" use="true" aggregateColumn="Month" limit="1000" style="business">
      <![CDATA[
        SELECT MONTH(OrderDate) as Month, 
               SUM(TotalAmount) as Sales,
               COUNT(*) as OrderCount
        FROM Orders 
        WHERE YEAR(OrderDate) = ${year}
          AND CustomerID IN (${activeCustomers.CustomerID})
        GROUP BY MONTH(OrderDate)
        ORDER BY Month
      ]]>
    </sheet>
    
    <sheet name="CustomerList" use="true" db="erpDB">
      <queryRef ref="customer_base"/>
    </sheet>
  </sheets>
</queries>
```

### JSON 형식

#### 기본 구조
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/SalesReport.xlsx",
    "style": "modern",
    "separateToc": true,
    "maxRows": 10000,
    "header": {
      "font": {
        "name": "Arial",
        "size": 12,
        "color": "FFFFFF",
        "bold": true
      },
      "fill": {
        "color": "4F81BD"
      }
    }
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "year": "2024"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "활성 고객 목록",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    },
    {
      "name": "productPrices",
      "type": "key_value_pairs",
      "description": "제품 가격",
      "query": "SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "limit": 1000,
      "style": "business",
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = ${year} GROUP BY MONTH(OrderDate)"
    }
  ]
}
```

## 🎨 템플릿 스타일 시스템

SQL2Excel은 사전 정의된 Excel 스타일링 템플릿을 포함한 포괄적인 템플릿 스타일 시스템을 제공합니다.

### 사용 가능한 템플릿 스타일

| 스타일 ID | 이름 | 설명 |
|----------|------|-------------|
| `default` | 기본 스타일 | 기본 엑셀 스타일 |
| `modern` | 모던 스타일 | 현대적인 디자인 |
| `dark` | 다크 스타일 | 어두운 테마 |
| `colorful` | 컬러풀 스타일 | 다채로운 색상 |
| `minimal` | 미니멀 스타일 | 간결한 디자인 |
| `business` | 비즈니스 스타일 | 업무용 스타일 |
| `premium` | 프리미엄 스타일 | 고급스러운 디자인 |

### 템플릿 스타일 사용법

#### 1. 전역 스타일 (XML)
```xml
<excel db="sampleDB" output="output/Report.xlsx" style="modern">
```

#### 2. 전역 스타일 (JSON)
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/Report.xlsx",
    "style": "modern"
  }
}
```

#### 3. CLI 스타일 옵션
```bash
node src/excel-cli.js export --xml queries.xml --style modern
```

#### 4. 시트별 스타일
```xml
<sheet name="SalesData" use="true" style="business">
  <![CDATA[
    SELECT * FROM Sales
  ]]>
</sheet>
```

### 템플릿 스타일 커스터마이징

템플릿 스타일을 사용자 정의 스타일로 덮어쓸 수 있습니다:

```xml
<excel db="sampleDB" output="output/Report.xlsx" style="modern">
  <header>
    <font name="Calibri" size="14" color="FFFFFF" bold="true"/>
    <fill color="2E75B6"/>
  </header>
  <body>
    <font name="Calibri" size="11" color="000000"/>
    <fill color="F8F9FA"/>
  </body>
</excel>
```

## 🔄 향상된 동적 변수 시스템

이 도구는 런타임에 데이터베이스에서 데이터를 추출하여 쿼리에서 사용할 수 있는 고급 동적 변수를 지원합니다.

### 변수 타입

| 타입 | 설명 | 접근 패턴 | 기본값 |
|------|-------------|----------------|---------|
| `column_identified` | 모든 컬럼을 컬럼명을 키로 하는 배열로 추출 | `${varName.columnName}` | ✅ 예 |
| `key_value_pairs` | 처음 두 컬럼을 키-값 쌍으로 추출 | `${varName.key}` | 아니오 |

### 사용 예제

#### XML 설정
```xml
<dynamicVars>
  <!-- column_identified 사용 (기본값) -->
  <dynamicVar name="customerData" description="고객 정보">
    <![CDATA[
      SELECT CustomerID, CustomerName, Region FROM Customers
    ]]>
  </dynamicVar>
  
  <!-- key_value_pairs 사용 -->
  <dynamicVar name="productPrices" type="key_value_pairs" description="제품 가격">
    <![CDATA[
      SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0
    ]]>
  </dynamicVar>
</dynamicVars>
```

#### 쿼리에서 사용
```sql
-- 시트 쿼리에서 사용
SELECT * FROM Orders 
WHERE CustomerID IN (${customerData.CustomerID})
  AND ProductID IN (${productPrices.ProductID})
  AND Region IN (${customerData.Region})
```

### 변수 처리
1. **실행 순서**: 동적 변수는 시트 쿼리 전에 처리됩니다
2. **데이터베이스 연결**: 지정된 데이터베이스 연결을 사용합니다
3. **오류 처리**: 변수 쿼리가 실패하면 빈 결과로 대체됩니다
4. **성능**: 변수는 한 번 실행되고 전체 내보내기 동안 캐시됩니다
5. **디버그 모드**: `DEBUG_VARIABLES=true`로 설정하여 상세한 변수 치환을 확인할 수 있습니다

## 🎨 고급 기능

### 1. Excel 스타일링

#### 폰트 스타일링
```xml
<font name="Arial" size="12" color="FFFFFF" bold="true" italic="false"/>
```

#### 채우기 스타일링
```xml
<fill color="4F81BD" patternType="solid"/>
```

#### 테두리 스타일링
```xml
<border>
  <top style="thin" color="000000"/>
  <bottom style="thin" color="000000"/>
  <left style="thin" color="000000"/>
  <right style="thin" color="000000"/>
</border>
```

#### 정렬
```xml
<alignment horizontal="center" vertical="center" wrapText="true"/>
```

### 2. 쿼리 재사용
```xml
<queryDefs>
  <queryDef id="customer_base" description="기본 고객 쿼리">
    <![CDATA[
      SELECT CustomerID, CustomerName, Email, Phone
      FROM Customers WHERE IsActive = 1
    ]]>
  </queryDef>
</queryDefs>

<sheets>
  <sheet name="CustomerList" use="true">
    <queryRef ref="customer_base"/>
  </sheet>
</sheets>
```

### 3. 별도 목차 생성

독립적인 목차 파일 생성:

#### XML 설정
```xml
<queries separateToc="true">
  <excel db="sampleDB" output="output/Report.xlsx" separateToc="true">
```

#### CLI 옵션
```bash
node src/excel-cli.js export --xml queries.xml --separate-toc
```

### 4. 파일 검증

이 도구는 파일명을 자동으로 검증하고 한글 문자에 대해 경고합니다:

```
⚠️  경고: 파일명에 한글이 포함되어 있습니다: 샘플쿼리.xml
   💡 권장사항: 파일명을 영문으로 변경하세요.
   💡 예시: "샘플쿼리.xml" → "sample-query.xml"
```

### 5. 데이터베이스 출처 정보

각 시트에는 데이터베이스 출처 정보가 포함됩니다:

```
📊 출처: sampleDB DB
```

## 🔧 CLI 명령어 참조

### 주요 명령어

| 명령어 | 설명 | 옵션 |
|---------|-------------|---------|
| `export` | Excel 파일 생성 | `--xml`, `--query`, `--style`, `--separate-toc`, `--var` |
| `validate` | 설정 파일 검증 | `--xml`, `--query` |
| `list-dbs` | 사용 가능한 데이터베이스 목록 | 없음 |
| `list-styles` | 사용 가능한 템플릿 스타일 목록 | 없음 |

### 내보내기 옵션

| 옵션 | 설명 | 예제 |
|--------|-------------|---------|
| `--xml <file>` | XML 쿼리 정의 파일 | `--xml queries.xml` |
| `--query <file>` | JSON 쿼리 정의 파일 | `--query queries.json` |
| `--style <style>` | 사용할 템플릿 스타일 | `--style modern` |
| `--separate-toc` | 별도 목차 파일 생성 | `--separate-toc` |
| `--var <key=value>` | 변수 값 설정 | `--var "year=2024"` |
| `--config <file>` | 데이터베이스 설정 파일 | `--config config/dbinfo.json` |
| `--db <dbname>` | 기본 데이터베이스 | `--db sampleDB` |

### 예제

```bash
# XML로 기본 내보내기
node src/excel-cli.js export --xml queries/sales.xml

# 템플릿 스타일로 내보내기
node src/excel-cli.js export --xml queries/sales.xml --style business

# 변수와 함께 내보내기
node src/excel-cli.js export --xml queries/sales.xml --var "year=2024" --var "region=North"

# 별도 목차와 함께 내보내기
node src/excel-cli.js export --xml queries/sales.xml --separate-toc

# 설정 검증
node src/excel-cli.js validate --xml queries/sales.xml

# 사용 가능한 스타일 목록
node src/excel-cli.js list-styles
```

## 📊 예제

### 완전한 XML 예제
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries separateToc="true" maxRows="5000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="business">
    <header>
      <font name="Arial" size="12" color="FFFFFF" bold="true"/>
      <fill color="1E3A8A"/>
      <colwidths min="20" max="50"/>
      <alignment horizontal="center" vertical="middle"/>
      <border>
        <all style="thin" color="1E40AF"/>
      </border>
    </header>
    <body>
      <font name="Arial" size="11" color="1F2937" bold="false"/>
      <fill color="F9FAFB"/>
      <alignment horizontal="left" vertical="middle"/>
      <border>
        <all style="thin" color="E5E7EB"/>
      </border>
    </body>
  </excel>
  
  <vars>
    <var name="year">2024</var>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
  </vars>
  
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="활성 고객 목록">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region 
        FROM Customers 
        WHERE IsActive = 1 AND Region IN ('North', 'South')
      ]]>
    </dynamicVar>
    <dynamicVar name="productCategories" type="key_value_pairs" description="제품 카테고리">
      <![CDATA[
        SELECT CategoryID, CategoryName 
        FROM Categories 
        WHERE IsActive = 1
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <sheets>
    <sheet name="MonthlySales" use="true" aggregateColumn="Month" limit="1000">
      <![CDATA[
        SELECT 
          MONTH(OrderDate) as Month,
          SUM(TotalAmount) as Sales,
          COUNT(*) as OrderCount,
          AVG(TotalAmount) as AvgOrderValue
        FROM Orders 
        WHERE YEAR(OrderDate) = ${year}
          AND CustomerID IN (${activeCustomers.CustomerID})
        GROUP BY MONTH(OrderDate)
        ORDER BY Month
      ]]>
    </sheet>
    
    <sheet name="CustomerAnalysis" use="true" style="modern">
      <![CDATA[
        SELECT 
          c.CustomerID,
          c.CustomerName,
          c.Region,
          COUNT(o.OrderID) as TotalOrders,
          SUM(o.TotalAmount) as TotalSpent,
          AVG(o.TotalAmount) as AvgOrderValue
        FROM Customers c
        LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
        WHERE c.CustomerID IN (${activeCustomers.CustomerID})
          AND (o.OrderDate IS NULL OR YEAR(o.OrderDate) = ${year})
        GROUP BY c.CustomerID, c.CustomerName, c.Region
        ORDER BY TotalSpent DESC
      ]]>
    </sheet>
    
    <sheet name="ProductSummary" use="true" limit="500">
      <![CDATA[
        SELECT 
          p.ProductID,
          p.ProductName,
          pc.CategoryName,
          SUM(od.Quantity) as TotalSold,
          SUM(od.Quantity * od.UnitPrice) as TotalRevenue
        FROM Products p
        JOIN Categories pc ON p.CategoryID = pc.CategoryID
        LEFT JOIN OrderDetails od ON p.ProductID = od.ProductID
        LEFT JOIN Orders o ON od.OrderID = o.OrderID
        WHERE pc.CategoryID IN (${productCategories.CategoryID})
          AND (o.OrderDate IS NULL OR YEAR(o.OrderDate) = ${year})
        GROUP BY p.ProductID, p.ProductName, pc.CategoryName
        ORDER BY TotalRevenue DESC
      ]]>
    </sheet>
  </sheets>
</queries>
```

### 완전한 JSON 예제
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/SalesReport.xlsx",
    "style": "business",
    "separateToc": true,
    "maxRows": 5000,
    "header": {
      "font": {
        "name": "Arial",
        "size": 12,
        "color": "FFFFFF",
        "bold": true
      },
      "fill": {
        "color": "1E3A8A"
      }
    }
  },
  "vars": {
    "year": "2024",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "dynamicVars": [
    {
      "name": "activeCustomers",
      "description": "활성 고객 목록",
      "query": "SELECT CustomerID, CustomerName FROM Customers WHERE IsActive = 1"
    },
    {
      "name": "productCategories",
      "type": "key_value_pairs",
      "description": "제품 카테고리",
      "query": "SELECT CategoryID, CategoryName FROM Categories WHERE IsActive = 1"
    }
  ],
  "sheets": [
    {
      "name": "MonthlySales",
      "use": true,
      "aggregateColumn": "Month",
      "limit": 1000,
      "query": "SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales FROM Orders WHERE YEAR(OrderDate) = ${year} GROUP BY MONTH(OrderDate)"
    },
    {
      "name": "CustomerAnalysis",
      "use": true,
      "style": "modern",
      "query": "SELECT CustomerID, CustomerName, COUNT(OrderID) as TotalOrders FROM Customers c LEFT JOIN Orders o ON c.CustomerID = o.CustomerID WHERE YEAR(o.OrderDate) = ${year} GROUP BY CustomerID, CustomerName"
    }
  ]
}
```

## 🔧 문제 해결

### 일반적인 문제

#### 1. 연결 오류
**문제**: 데이터베이스에 연결할 수 없음
**해결책**: 
- `config/dbinfo.json` 설정 확인
- 네트워크 연결 상태 확인
- 적절한 데이터베이스 권한 확인

#### 2. 변수 해석 오류
**문제**: 변수가 올바르게 해석되지 않음
**해결책**:
- 변수 구문 확인 (${varName})
- 변수명이 정확히 일치하는지 확인
- 변수 참조의 오타 확인
- 디버그 모드 활성화: `DEBUG_VARIABLES=true`

#### 3. 동적 변수 오류
**문제**: 동적 변수가 해석되지 않음
**해결책**:
- 변수 쿼리 구문 확인
- 사용 시 변수명 확인
- 변수 쿼리에 대한 데이터베이스 권한 확인
- 변수 타입 설정 검토

#### 4. 파일 권한 오류
**문제**: 출력 파일을 쓸 수 없음
**해결책**:
- 출력 디렉토리 권한 확인
- 출력 디렉토리가 존재하는지 확인
- 열린 Excel 파일 닫기

#### 5. 메모리 문제
**문제**: 대용량 데이터셋에서 메모리 부족 오류
**해결책**:
- `limit` 속성을 사용하여 행 수 제한
- 더 작은 청크로 데이터 처리
- Node.js 메모리 제한 증가

#### 6. 한글 파일명 경고
**문제**: 파일명에 한글 문자가 포함됨
**해결책**:
- 파일명을 영문으로 변경
- 설명적인 영문 이름 사용
- 파일명에 특수 문자 사용 금지

#### 7. 템플릿 스타일을 찾을 수 없음
**문제**: 템플릿 스타일이 로드되지 않음
**해결책**:
- `templates/excel-styles.xml` 파일이 존재하는지 확인
- 스타일 ID 철자 확인
- `list-styles` 명령어로 사용 가능한 스타일 확인

### 디버그 모드
상세한 변수 치환을 확인하려면 디버그 모드를 활성화하세요:
```bash
DEBUG_VARIABLES=true node src/excel-cli.js export --xml ./queries/sample.xml
```

### 오류 복구
1. **로그 확인**: 오류 세부사항을 위해 콘솔 출력 검토
2. **설정 검증**: `validate` 명령어 사용
3. **연결 테스트**: `list-dbs` 명령어 사용
4. **쿼리 단순화**: 간단한 쿼리로 먼저 테스트
5. **파일 권한 확인**: 적절한 파일 접근 권한 확인

## 📞 지원

- **문서**: 프로젝트 문서 참조
- **이슈**: GitHub를 통해 이슈 보고
- **이메일**: sql2excel.nodejs@gmail.com
- **웹사이트**: sql2excel.com

## 📝 변경 이력

### 버전 2.0.0 (최신)
- ✨ 7가지 사전 정의된 스타일이 포함된 템플릿 스타일 시스템 추가
- ✨ 키-값 쌍 지원이 포함된 향상된 동적 변수
- ✨ 별도 목차 생성 기능 추가
- ✨ 한글 문자 경고가 포함된 향상된 파일 검증
- ✨ 시트별 스타일링 지원 추가
- ✨ 스타일 목록 및 검증이 포함된 향상된 CLI
- ✨ 향상된 오류 처리 및 사용자 피드백
- 🐛 다양한 버그 수정 및 성능 개선

### 버전 1.5.0
- ✨ 다중 데이터베이스 지원 추가
- ✨ 향상된 변수 시스템
- ✨ 향상된 Excel 스타일링 옵션

### 버전 1.0.0
- 🎉 초기 릴리스
- ✨ 기본 SQL to Excel 변환
- ✨ 멀티 시트 지원
- ✨ 변수 시스템
