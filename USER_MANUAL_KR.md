# SQL2Excel 도구 사용자 매뉴얼

## 📖 목차
- [개요](#개요)
- [설치 및 설정](#설치-및-설정)
- [기본 사용법](#기본-사용법)
- [쿼리 정의 파일 구조](#쿼리-정의-파일-구조)
- [향상된 동적 변수 시스템](#향상된-동적-변수-시스템)
- [자동 DateTime 변수](#자동-datetime-변수)
- [생성 타임스탬프 기능](#생성-타임스탬프-기능)
- [고급 기능](#고급-기능)
- [템플릿 스타일 시스템](#템플릿-스타일-시스템)
- [빌드 및 배포](#빌드-및-배포)
- [CLI 명령 참조](#cli-명령-참조)
- [예제](#예제)
- [문제 해결](#문제-해결)

## 🎯 개요

SQL2Excel은 고급 스타일링, 템플릿 지원, 독립 실행 파일 배포 기능을 갖춘 SQL 쿼리 결과로 엑셀 파일을 생성하는 강력한 Node.js 기반 도구입니다.

### v2.1.5 주요 변경

- 동적 변수 DB 라우팅
  - XML `dynamicVar`에서 `db` 속성 지원 (`database`의 별칭)
  - 각 동적 변수는 지정된 DB 어댑터에서 실행, 미지정 시 전역 기본 DB 사용
- XML 검증 업데이트
  - XML 스키마 검증에서 `queryDef`의 `db` 속성 허용 (실행 DB는 여전히 시트 `db` 또는 전역 기본 DB로 결정)

### v2.1.4 주요 변경

- 어댑터별 DB 연결 테스트 쿼리 도입
  - 모든 DB 어댑터에 `getTestQuery()` 추가
    - MSSQL: `SELECT 1 as test`, MySQL/MariaDB: `SELECT 1 as test`, PostgreSQL: `SELECT 1`, SQLite: `SELECT 1`, Oracle: `SELECT 1 FROM dual`
  - `excel-cli.js`가 어댑터의 테스트 쿼리를 사용하여 연결 검증 수행 (Oracle 검증 이슈 해결)
- 샘플 스키마 정합성(Orders)
  - PostgreSQL/MySQL: `SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID` 추가
  - 샘플 데이터와 컬럼 일치, MSSQL 스키마와의 정합성 향상

### v2.1.3-beta (v1.3.3) 주요 변경

- 시트에서 특정 컬럼 제외를 위한 `exceptColumns` 속성 추가 (XML/JSON)

### 주요 기능
- 🗄️ **다중 데이터베이스 지원**: ORACLE, PostgreSQL, MSSQL, MySQL, MariaDB를 통합 인터페이스로 지원
- 📊 **다중 시트 지원**: 하나의 엑셀 파일 내에서 여러 SQL 쿼리 결과를 별도의 시트에 저장
- 🎨 **템플릿 스타일 시스템**: 일관된 디자인을 위한 사전 정의된 엑셀 스타일링 템플릿 (7가지 내장 스타일)
- 🔗 **다중 DB 연결**: 각 시트마다 다른 데이터베이스 연결 사용 가능
- 📝 **변수 시스템**: 동적 쿼리 생성을 위한 변수 사용
- 🔄 **향상된 동적 변수**: 실시간으로 데이터베이스에서 값을 추출하여 고급 처리
- 🔄 **쿼리 재사용**: 공통 쿼리를 정의하고 여러 시트에서 재사용
- ⚙️ **파라미터 오버라이드**: 각 시트에 대해 쿼리 정의 파라미터를 다른 값으로 재정의
- 📋 **자동 목차 생성**: 하이퍼링크가 있는 목차 시트 자동 생성
- 📊 **집계 기능**: 지정된 컬럼 값별 개수 자동 집계 및 표시
- 🚦 **쿼리 제한**: 대용량 데이터 처리를 위한 행 개수 제한
- 🖥️ **CLI 인터페이스**: 간단한 명령줄 도구 실행
- 🪟 **Windows 배치 파일**: Windows 사용자를 위한 대화형 배치 파일
- 📄 **XML/JSON 지원**: 유연한 구성 파일 형식 지원
- 🎯 **시트별 스타일링**: 개별 시트에 다른 스타일 적용
- 📦 **독립 실행 파일**: Node.js 의존성 없이 배포할 수 있는 독립 실행 파일(.exe) 생성
- 🌐 **다국어 지원**: 한국어 및 영어 릴리스 패키지
- 🔧 **릴리스 자동화**: 적절한 문서와 함께 자동 릴리스 패키지 생성
- 🕒 **생성 타임스탬프**: 각 엑셀 시트에 생성 타임스탬프 표시
- ⏰ **향상된 DateTime 변수**: 전세계 22개 타임존 지원 및 커스텀 포맷
- 📋 **SQL 쿼리 포맷팅**: 목차에서 줄바꿈을 포함한 원본 SQL 포맷 유지
- 🔧 **입력 유효성 검증**: 파일 경로 입력에 대한 자동 공백 제거

### v2.1.2(v1.3.2) What's New

- 확장자 기반 시트별 내보내기 라우팅(유지)
  - `.xlsx` / `.xls` → 단일 엑셀 통합문서 생성 (기존 동작)
  - `.csv` → 시트별 CSV 파일 생성
  - 그 외 모든 확장자(예: `.txt`, `.log`, `.data`, `.sql` 등) → 시트별 TXT 파일 생성 (탭 구분)
- 디렉토리/파일명 및 포맷팅 규칙 (시트별 내보내기)
  - 출력 디렉토리: `<출력파일베이스>`로 단순화 (확장자 접미사 제거)
    - 예: `output="d:/temp/report.csv"` → `d:/temp/report/`
  - 각 시트는 `originalName`(원본 시트명)으로 파일 생성 (파일시스템 안전화, 최대 100자)
  - CSV 인용/이스케이프는 `.csv`일 때만 적용, 비-CSV는 인용 없이 기록
  - CSV/TXT 모두 필드 내부 줄바꿈(\r/\n)을 공백으로 정규화
  - 날짜 값은 CSV/TXT 및 SQL 리터럴에서 `yyyy-MM-dd HH:mm:ss`(24시간) 형식으로 직렬화

이전 버전(v1.2.11)

- 시트명 31자 초과 경고 처리 및 엑셀에서 잘릴 수 있음 안내
- TOC: "Original Name" 컬럼 추가, Note(툴팁) 제거

## 🛠️ 설치 및 설정

### 1. 시스템 요구사항

#### 개발/소스 코드 사용 시
- Node.js 16.0 이상
- 데이터베이스 서버 (MSSQL 2012+, MySQL 5.7+, 또는 MariaDB 10.2+)
- 적절한 데이터베이스 권한

#### 독립 실행 파일 사용 시
- Windows 10 이상 (64비트)
- 데이터베이스 서버 (MSSQL 2012+, MySQL 5.7+, 또는 MariaDB 10.2+)
- 적절한 데이터베이스 권한
- **Node.js 설치 불필요**

### 2. 설치 옵션

#### 옵션 A: 개발 설치
```bash
# 소스 코드 복제 또는 다운로드
npm install

# 독립 실행 파일 빌드 (선택사항)
npm run build
```

#### 옵션 B: 독립 실행 파일
1. 릴리스 섹션에서 릴리스 패키지 다운로드
2. 원하는 디렉토리에 압축 해제
3. 대화형 메뉴 실행:
   - 영어: `run.bat` 실행
   - 한글: `실행하기.bat` 실행
4. 또는 `sql2excel-v{version}.exe`를 직접 사용

### 3. 데이터베이스 연결 설정
`config/dbinfo.json` 파일을 생성하세요:

#### 다중 데이터베이스 지원 (v2.0.0-beta+)
```json
{
  "sampleDB": {
    "type": "mssql",          // 선택사항: "mssql" (기본값), "mysql", 또는 "mariadb"
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
  "mysqlDB": {
    "type": "mysql",          // MySQL 데이터베이스
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password",
    "options": {
      "connectionTimeout": 30000
    }
  },
  "mariaDB": {
    "type": "mariadb",        // MariaDB 데이터베이스
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  }
}
```

### 시트별 내보내기 (CSV/TXT)

- Routing by `excel.output` extension
  - `.xlsx`/`.xls` → Single Excel workbook
  - `.csv` → Per-sheet CSV
  - Others → Per-sheet TXT (tab-delimited)
- Output directory and filenames
  - Files are written under `<output_basename>` (updated in v1.3.2)
  - Each file name is the sheet `originalName` (sanitized, max 100 chars). No 31-char limit (Excel-only)
  - CSV/TXT formatting: `.csv` applies CSV quoting/escaping; non-CSV writes plain values; internal newlines (\r/\n) normalized to spaces for both
  - Dates: `yyyy-MM-dd HH:mm:ss` (24-hour)

### Sheet 옵션: exceptColumns (v1.3.3)

- 목적: 시트 쿼리 결과에서 특정 컬럼을 최종 파일(Excel/CSV/TXT)에 포함하지 않도록 제외
- XML: `<sheet name="..." exceptColumns="ColA, ColB">`  (쉼표로 구분)
- JSON: `"exceptColumns": ["ColA", "ColB"]` 또는 하위호환 `"except_columns": ["ColA", "ColB"]`
- 키 대소문자 구분 없이 탐색 (case-insensitive)
- 동작: 내보내기 직전에 지정 컬럼을 레코드셋에서 제거하여 모든 출력 포맷에서 배제
- 예시:
  ```xml
  <sheet name="UserList" use="true" exceptColumns="password, email">
    <![CDATA[
      SELECT * FROM users
    ]]>
  </sheet>
```

## 🚀 기본 사용법

### 언어 설정

도구는 환경 변수를 통해 한국어와 영어를 지원합니다:

#### 개발 환경
- **영어**: `run.bat` 실행 (자동으로 `LANGUAGE=en` 설정)
- **한글**: `실행하기.bat` 실행 (자동으로 `LANGUAGE=kr` 설정)

#### 배포 환경 (Release Package)
- **영어**: `run.bat` 실행
- **한글**: `실행하기.bat` 실행

> 💡 **참고**: 환경 변수 `LANGUAGE`를 사용하여 언어를 제어합니다. 기본값은 영어(en)입니다.

### 방법 1: 대화형 배치 파일 (Windows 사용자 권장)

#### 개발 환경
```bash
# 영어 버전
run.bat

# 한글 버전
실행하기.bat
```

#### 배포 환경 (Release Package)
```bash
# 영어 버전
run.bat

# 한글 버전
실행하기.bat
```

대화형 메뉴 제공 항목:
1. **쿼리 정의 파일 유효성 검사** - XML/JSON 파일의 오류 확인
2. **데이터베이스 연결 테스트** - 데이터베이스 연결 확인
3. **엑셀 파일 생성 (XML 파일)** - XML 쿼리 정의를 사용하여 내보내기
4. **엑셀 파일 생성 (JSON 파일)** - JSON 쿼리 정의를 사용하여 내보내기
5. **도움말 표시** - 자세한 도움말 정보 표시

### 방법 2: 직접 CLI 명령 실행

#### 개발 환경 (Node.js)
```bash
# XML 쿼리 파일 사용
node src/excel-cli.js export --xml ./queries/sample-queries.xml

# JSON 쿼리 파일 사용
node src/excel-cli.js export --query ./queries/sample-queries.json

# 변수와 함께 실행
node src/excel-cli.js export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

# 템플릿 스타일 사용
node src/excel-cli.js export --xml ./queries/sample-queries.xml --style modern
```

#### 독립 실행 파일
```bash
# XML 쿼리 파일 사용
sql2excel.exe export --xml ./queries/sample-queries.xml

# JSON 쿼리 파일 사용
sql2excel.exe export --query ./queries/sample-queries.json

# 변수와 함께 실행
sql2excel.exe export --xml ./queries/sample-queries.xml --var "year=2024" --var "dept=IT"

# 템플릿 스타일 사용
sql2excel.exe export --xml ./queries/sample-queries.xml --style modern
```

### 방법 3: NPM 스크립트 (개발 전용)
```bash
# 엑셀로 내보내기
npm run export -- --xml ./queries/sample-queries.xml

# 구성 유효성 검사
npm run validate -- --xml ./queries/sample-queries.xml

# 데이터베이스 연결 테스트
npm run list-dbs

# 독립 실행 파일 빌드
npm run build

# 릴리스 패키지 생성
npm run release
```

### 일반 명령어

#### 쿼리 파일 유효성 검사
```bash
# 개발 환경
node src/excel-cli.js validate --xml ./queries/sample-queries.xml

# 독립 실행 파일
sql2excel.exe validate --xml ./queries/sample-queries.xml
```

#### 데이터베이스 연결 테스트
```bash
# 개발 환경
node src/excel-cli.js list-dbs

# 독립 실행 파일
sql2excel.exe list-dbs
```

#### 사용 가능한 템플릿 스타일 목록
```bash
# 개발 환경
node src/excel-cli.js list-styles

# 독립 실행 파일
sql2excel.exe list-styles
```

## 비대화형 CLI (v1.2.10 신규)

`--mode` 플래그를 사용해 대화형 메뉴 없이 바로 실행할 수 있습니다.

### Node.js
```bash
# 쿼리 정의 검증
node app.js --mode=validate --xml=./queries/sample-queries.xml
# 또는 JSON
node app.js --mode=validate --query=./queries/sample-queries.json

# DB 연결 테스트
node app.js --mode=test

# 엑셀 내보내기
node app.js --mode=export --xml=./queries/sample-queries.xml
# 또는 JSON
node app.js --mode=export --query=./queries/sample-queries.json

# 도움말
node app.js --mode=help
```

### 독립 실행 파일(EXE)
```bash
sql2excel.exe --mode=validate --xml=./queries/sample-queries.xml
sql2excel.exe --mode=test
sql2excel.exe --mode=export --xml=./queries/sample-queries.xml
sql2excel.exe --mode=help
```

## 📋 쿼리 정의 파일 구조

### XML 형식

#### 기본 구조
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries maxRows="10000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="modern">
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
    "maxRows": 10000
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

### 시트별 내보내기 (CSV/TXT)

- `excel.output` 확장자에 따른 라우팅
  - `.xlsx`/`.xls` → 단일 엑셀 통합문서
  - `.csv` → 시트별 CSV
  - 그 외 → 시트별 TXT (탭 구분)
- 출력 디렉토리 및 파일명
  - 출력은 `<출력파일베이스>` 하위에 생성 (v1.3.2 변경)
  - 파일명은 시트 `originalName` 사용 (파일시스템 안전화, 최대 100자). 31자 제한 없음(엑셀 전용)
  - 포맷팅: `.csv`는 CSV 인용/이스케이프 적용, 비-CSV는 인용 없음
  - 내부 줄바꿈(\r/\n)은 CSV/TXT 모두 공백으로 정규화
  - 날짜 직렬화: `yyyy-MM-dd HH:mm:ss` (24시간)

## 🔗 다중 데이터베이스

통합 어댑터와 유연한 라우팅으로 여러 데이터베이스를 지원합니다.

- **지원 드라이버**: MSSQL(`mssql`), MySQL(`mysql2`), MariaDB(`mysql2`), PostgreSQL(`pg`), SQLite(`better-sqlite3`), Oracle(`oracledb`)
- **설정**: `config/dbinfo.json`에 다수의 DB 키를 정의하고 `type`(미지정 시 `mssql`)과 접속 정보를 설정하세요. 상세 예시는 위 “다중 데이터베이스 지원 (v2.0.0-beta+)” 섹션 참고.
- **런타임 DB 선택 우선순위 (v2.1.5+)
  - 기본 DB 키: CLI `--db` > `excel.db`
  - 시트별: `sheet.db`가 기본 DB를 오버라이드
  - 동적 변수: `dynamicVar.database` 또는 `dynamicVar.db`가 기본 DB를 오버라이드
- **혼합 사용**: 하나의 내보내기에서 서로 다른 DB를 동시에 사용할 수 있습니다. XML/JSON 예시는 “다중 데이터베이스 지원 (v2.0.0-beta+)” 섹션을 참고하세요.
- **연결 테스트**: 내보내기 전 `node src/excel-cli.js list-dbs`(개발) 또는 `sql2excel.exe list-dbs`(EXE)로 확인하세요.
- **어댑터 동작**: 행 제한과 함수가 DB별로 자동 조정됩니다 (예: MSSQL=TOP, MySQL/MariaDB=LIMIT).

## 🎨 템플릿 스타일 시스템
| 스타일 ID | 이름 | 설명 |
|----------|------|------|
| `default` | 기본 스타일 | 기본 엑셀 스타일 |
| `modern` | 모던 스타일 | 현대적인 디자인 |
| `dark` | 다크 스타일 | 어두운 테마 |
| `colorful` | 컬러풀 스타일 | 다채로운 색상 |
| `minimal` | 미니멀 스타일 | 간결한 디자인 |
| `business` | 비즈니스 스타일 | 업무용 스타일 |
| `premium` | 프리미엄 스타일 | 고급스러운 디자인 |

### 템플릿 스타일 사용

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

템플릿 스타일을 커스텀 스타일링으로 재정의할 수 있습니다:

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

이 도구는 런타임에 데이터를 추출하여 쿼리에서 사용할 수 있는 고급 동적 변수를 지원합니다.

### 변수 유형

| 유형 | 설명 | 액세스 패턴 | 기본값 |
|------|------|-------------|--------|
| `column_identified` | 모든 컬럼을 컬럼명으로 키가 지정된 배열로 추출 | `${varName.columnName}` | ✅ 예 |
| `key_value_pairs` | 처음 두 컬럼을 키-값 쌍으로 추출 | `${varName.key}` | 아니오 |

### 사용 예제

#### XML 구성
```xml
<dynamicVars>
  <!-- column_identified 사용 (기본값), 특정 DB에서 실행 -->
  <dynamicVar name="customerData" description="고객 정보" db="sampleDB">
    <![CDATA[
      SELECT CustomerID, CustomerName, Region FROM Customers
    ]]>
  </dynamicVar>
  
  <!-- key_value_pairs 사용, 다른 DB에서 실행 -->
  <dynamicVar name="productPrices" type="key_value_pairs" description="제품 가격" database="mariaDB">
    <![CDATA[
      SELECT ProductID, UnitPrice FROM Products WHERE Discontinued = 0
    ]]>
  </dynamicVar>
</dynamicVars>
```

#### 쿼리에서 사용
```sql
-- 시트 쿼리에서
SELECT * FROM Orders 
WHERE CustomerID IN (${customerData.CustomerID})
  AND ProductID IN (${productPrices.ProductID})
  AND Region IN (${customerData.Region})
```

### 변수 처리
1. **실행 순서**: 동적 변수는 시트 쿼리 전에 처리됩니다
2. **데이터베이스 연결**: 지정된 데이터베이스 연결을 사용합니다
3. **오류 처리**: 변수 쿼리가 실패하면 빈 결과로 대체됩니다
4. **성능**: 변수는 한 번 실행되고 전체 내보내기에 대해 캐시됩니다
5. **디버그 모드**: 자세한 변수 치환을 위해 `DEBUG_VARIABLES=true`로 활성화

참고:
- `dynamicVar`에서 지원하는 속성: `name`, `description`, `type`, `db`, `database` (`db`는 별칭). 둘 다 있으면 `database`가 우선합니다.
- `queryDef`는 XML 검증에서 `db` 속성을 허용합니다. 실행 시점의 DB는 시트의 `db` 또는 전역 기본 DB로 결정됩니다.

## 🕒 커스텀 날짜/시간 변수

SQL2Excel은 원하는 형식으로 현재 날짜와 시간을 표시할 수 있는 강력한 커스텀 날짜 변수 시스템을 제공합니다. 이러한 변수는 쿼리, 파일 이름 및 모든 텍스트 콘텐츠에서 사용할 수 있습니다.

### 기본 문법

**타임존 지정 (권장):**
```
${DATE.<TIMEZONE>:format}
```

**타임존 생략 (로컬 시간):**
```
${DATE:format}
```

- **타임존 지정**: 특정 타임존 시간 사용 (예: `${DATE.UTC:YYYY-MM-DD}`, `${DATE.KST:YYYY-MM-DD}`)
- **타임존 생략**: 서버의 로컬 시간 사용 (예: `${DATE:YYYY-MM-DD}`)

> **참고**: 타임존을 생략하면 서버의 로컬 타임존 시간이 사용됩니다. 글로벌 일관성을 위해서는 타임존을 명시적으로 지정하는 것을 권장합니다.

### 지원 타임존

| 타임존 코드 | 설명 | UTC 오프셋 | 지역 |
|------------|------|-----------|------|
| **UTC** | 협정 세계시 | UTC+0 | 세계 표준 |
| **GMT** | 그리니치 표준시 | UTC+0 | 영국 |
| **KST** | 한국 표준시 | UTC+9 | 대한민국 |
| **JST** | 일본 표준시 | UTC+9 | 일본 |
| **CST** | 중국 표준시 | UTC+8 | 중국 |
| **SGT** | 싱가포르 표준시 | UTC+8 | 싱가포르 |
| **PHT** | 필리핀 표준시 | UTC+8 | 필리핀 |
| **AEST** | 호주 동부 표준시 | UTC+10 | 호주 (동부) |
| **ICT** | 인도차이나 표준시 | UTC+7 | 태국, 베트남 |
| **IST** | 인도 표준시 | UTC+5:30 | 인도 |
| **GST** | 걸프 표준시 | UTC+4 | UAE, 오만 |
| **CET** | 중앙 유럽 표준시 | UTC+1 | 독일, 프랑스, 이탈리아, 폴란드 |
| **EET** | 동유럽 표준시 | UTC+2 | 동유럽 |
| **EST** | 미국 동부 표준시 | UTC-5 | 미국 동부 |
| **AST** | 대서양 표준시 | UTC-4 | 캐나다 동부 |
| **CST_US** | 중부 표준시 | UTC-6 | 미국, 캐나다, 멕시코 중부 |
| **MST** | 미국 산악 표준시 | UTC-7 | 미국 산악 지대 |
| **PST** | 미국 서부 표준시 | UTC-8 | 미국 서부 |
| **AKST** | 알래스카 표준시 | UTC-9 | 알래스카 |
| **HST** | 하와이 표준시 | UTC-10 | 하와이 |
| **BRT** | 브라질리아 표준시 | UTC-3 | 브라질 |
| **ART** | 아르헨티나 표준시 | UTC-3 | 아르헨티나 |

### 지원 토큰

| 토큰 | 설명 | 예제 |
|------|------|------|
| `YYYY` | 4자리 연도 | `2024` |
| `YY` | 2자리 연도 | `24` |
| `MM` | 2자리 월 (01-12) | `10` |
| `M` | 월 (1-12) | `10` |
| `DD` | 2자리 일 (01-31) | `21` |
| `D` | 일 (1-31) | `21` |
| `HH` | 2자리 시간 (00-23) | `15` |
| `H` | 시간 (0-23) | `15` |
| `mm` | 2자리 분 (00-59) | `30` |
| `m` | 분 (0-59) | `30` |
| `ss` | 2자리 초 (00-59) | `45` |
| `s` | 초 (0-59) | `45` |
| `SSS` | 밀리초 (000-999) | `123` |
| `yyyy, yy, dd, d, hh, h, sss` | 소문자 토큰 지원 | `2024, 24, 09, 9, 07, 7, 123` |

### 일반적인 형식 예시

#### 표준 ISO 형식
| 형식 | 출력 예시 | 사용 예 |
|------|----------|---------|
| `${DATE.UTC:YYYY-MM-DD}` | `2024-10-21` | 표준 날짜 형식 |
| `${DATE.UTC:YYYY-MM-DD HH:mm:ss}` | `2024-10-21 15:30:45` | 표준 타임스탬프 |
| `${DATE.UTC:YYYYMMDD_HHmmss}` | `20241021_153045` | 파일명용 타임스탬프 |

#### 지역별 예시
| 형식 | 출력 예시 | 지역 |
|------|----------|------|
| `${DATE.EST:YYYY-MM-DD HH:mm:ss}` | `2024-10-21 10:30:45` | 미국 동부 |
| `${DATE.PST:YYYY-MM-DD HH:mm:ss}` | `2024-10-21 07:30:45` | 미국 서부 |
| `${DATE.KST:YYYY년 MM월 DD일}` | `2024년 10월 22일` | 대한민국 |
| `${DATE.JST:YYYY年MM月DD日}` | `2024年10月22日` | 일본 |
| `${DATE.CET:DD.MM.YYYY HH:mm}` | `21.10.2024 16:30` | 중앙 유럽 |
| `${DATE.IST:DD/MM/YYYY HH:mm}` | `21/10/2024 21:00` | 인도 |
| `${DATE.AEST:DD/MM/YYYY HH:mm}` | `22/10/2024 01:30` | 호주 |

#### 다양한 날짜 형식
| 형식 | 출력 예시 | 사용 예 |
|------|----------|---------|
| `${DATE.UTC:YYYY/MM/DD}` | `2024/10/21` | 슬래시 형식 |
| `${DATE.UTC:YYYYMMDD}` | `20241021` | 파일명용 압축 형식 |
| `${DATE.UTC:YYYY.MM.DD}` | `2024.10.21` | 점 구분 형식 |
| `${DATE.UTC:YYYY-MM}` | `2024-10` | 연월만 표시 |
| `${DATE.UTC:HH:mm:ss}` | `15:30:45` | 시간만 표시 |
| `${DATE.UTC:HH:mm:ss.SSS}` | `15:30:45.123` | 밀리초 포함 |

### 사용 예제

#### 1. 파일 이름에 날짜 포함

**타임존 지정:**
```xml
<excel db="sampleDB" output="output/report_${DATE.UTC:YYYYMMDD}_${DATE.UTC:HHmmss}.xlsx">
```
출력: `output/report_20241021_153045.xlsx`

**로컬 시간 사용:**
```xml
<excel db="sampleDB" output="output/report_${DATE:YYYYMMDD}_${DATE:HHmmss}.xlsx">
```
출력: `output/report_20241021_183045.xlsx` (서버의 로컬 시간 사용)

### 파일명 변수 (출력 경로)

- `excel.output`에 변수를 사용하여 파일명을 제어할 수 있습니다:
  - `${DB_NAME}`: 현재 기본 DB 키 주입. 커스텀 `$(DB_NAME}`는 자동으로 `${DB_NAME}`로 정규화됩니다.
  - `${DATE:...}`: 로컬 시간 사용. `${DATE.TZ:...}`는 타임존을 명시합니다.
  - 소문자 토큰 지원: `yyyy, yy, dd, d, hh, h, sss`.
- 자동 접미사 제거:
  - 더 이상 파일명에 `_yyyymmddhhmmss`가 자동으로 붙지 않습니다. 필요한 경우 `excel.output`에 DATE 변수를 사용하세요.

#### 2. XML 쿼리에서 사용
```xml
<vars>
  <var name="reportDate">${DATE.KST:YYYY년 MM월 DD일}</var>
  <var name="department">IT</var>
</vars>

<sheets>
  <sheet name="DailyReport" use="true">
    <![CDATA[
      SELECT 
        '${reportDate} 일일 리포트' as title,
        '${DATE.KST:YYYY-MM-DD HH:mm:ss}' as generated_at,
        * FROM orders 
      WHERE created_date >= '${DATE.KST:YYYY-MM-DD}'
        AND department = '${department}'
    ]]>
  </sheet>
</sheets>
```

#### 3. JSON 쿼리에서 사용
```json
{
  "vars": {
    "reportTitle": "일일 리포트 - ${DATE.KST:YYYY년 MM월 DD일}",
    "currentTime": "${DATE.KST:YYYY-MM-DD HH:mm}"
  },
  "sheets": [
    {
      "name": "Report_${DATE.UTC:YYYYMMDD}",
      "query": "SELECT '${reportTitle}' as title, '${currentTime}' as generated_at FROM users"
    }
  ]
}
```

#### 4. WHERE 조건에서 사용
```sql
-- 오늘 날짜의 레코드 필터링 (한국 시간)
SELECT * FROM orders 
WHERE order_date >= '${DATE.KST:YYYY-MM-DD} 00:00:00'
  AND order_date < '${DATE.KST:YYYY-MM-DD} 23:59:59'

-- 특정 월의 데이터 조회
SELECT * FROM sales 
WHERE sale_month = '${DATE.UTC:YYYY-MM}'
```

#### 5. 백업 테이블 생성
```sql
CREATE TABLE backup_orders_${DATE.UTC:YYYYMMDD} AS 
SELECT * FROM orders WHERE created_at < '${DATE.KST:YYYY-MM-DD HH:mm:ss}'
```

#### 6. 다중 타임존 보고서
```xml
<sheet name="GlobalReport" use="true">
  <![CDATA[
    SELECT 
      'UTC: ${DATE.UTC:YYYY-MM-DD HH:mm:ss}' as UTC_Time,
      '뉴욕: ${DATE.EST:YYYY-MM-DD HH:mm:ss}' as NewYork_Time,
      '로스앤젤레스: ${DATE.PST:YYYY-MM-DD HH:mm:ss}' as LA_Time,
      '런던: ${DATE.GMT:YYYY-MM-DD HH:mm:ss}' as London_Time,
      '파리: ${DATE.CET:YYYY-MM-DD HH:mm:ss}' as Paris_Time,
      '도쿄: ${DATE.JST:YYYY-MM-DD HH:mm:ss}' as Tokyo_Time,
      '서울: ${DATE.KST:YYYY-MM-DD HH:mm:ss}' as Seoul_Time,
      '시드니: ${DATE.AEST:YYYY-MM-DD HH:mm:ss}' as Sydney_Time
  ]]>
</sheet>
```

### 디버그 모드
날짜 변수 치환을 확인하려면 디버그 모드를 활성화하세요:
```bash
DEBUG_VARIABLES=true node src/excel-cli.js export --xml queries/my-queries.xml
```

다음과 같은 출력이 표시됩니다:
```
시각 함수 [DATE.UTC:YYYYMMDD] 치환: 20241021
시각 함수 [DATE.KST:YYYY-MM-DD HH:mm:ss] 치환: 2024-10-22 00:30:45
시각 함수 [DATE.KST:YYYY년 MM월 DD일] 치환: 2024년 10월 22일
```

## 🕒 생성 타임스탬프 기능

SQL2Excel은 생성된 각 엑셀 시트에 자동으로 생성 타임스탬프를 추가하여 데이터가 언제 생성되었는지에 대한 명확한 정보를 제공합니다.

### 자동 타임스탬프 표시

각 엑셀 시트에는 다음이 포함됩니다:
- **데이터베이스 소스 정보**: 데이터가 어떤 데이터베이스에서 왔는지 표시
- **생성 타임스탬프**: 엑셀 파일이 정확히 언제 생성되었는지 표시

### 시트 헤더 형식
```
📊 출처: sampleDB DB
🕒 생성일시: 2024년 10월 5일 토요일 오후 11:30:25
```

### 타임스탬프 형식
생성 타임스탬프는 한국 로케일 형식을 사용합니다:
- **날짜**: `2024년 10월 5일` (한국어로 년월일)
- **요일**: `토요일` (한국어 요일 이름)
- **시간**: `오후 11:30:25` (한국어 오전/오후와 함께 12시간 형식)

### 이점
1. **데이터 신선도**: 사용자는 데이터가 얼마나 최신인지 즉시 확인 가능
2. **감사 추적**: 보고서가 언제 생성되었는지 명확한 문서화 제공
3. **버전 관리**: 동일한 보고서의 다른 버전을 구별하는 데 도움
4. **규정 준수**: 생성된 모든 데이터에 타임스탬프를 기록하여 감사 요구사항 지원

### 시각적 스타일링
- **데이터베이스 소스**: 흰색 굵은 글씨의 파란색 배경
- **생성 타임스탬프**: 흰색 굵은 글씨의 파란색 배경
- **일관된 형식**: 통합 문서의 모든 시트에 적용

### 사용 예제
엑셀 파일을 생성하면 각 시트에 자동으로 다음이 포함됩니다:
```
📊 출처: customerDB DB
🕒 생성일시: 2024년 10월 5일 토요일 오후 11:30:25

[여기에서 데이터 테이블이 시작됩니다]
```

이 기능은 자동으로 작동합니다 - 구성이 필요하지 않습니다!

## 🎨 고급 기능

### 1. 다중 데이터베이스 지원 (v2.0.0-beta+)

SQL2Excel은 이제 통합 인터페이스로 여러 데이터베이스 타입을 지원합니다:

#### 지원 데이터베이스
- **MSSQL** (SQL Server 2012+)
- **MySQL** (5.7+)
- **MariaDB** (10.2+)

#### 설정
`config/dbinfo.json`의 데이터베이스 연결에 `type` 필드를 추가하세요:

```json
{
  "mssqlDB": {
    "type": "mssql",     // 또는 하위 호환성을 위해 생략 가능
    "server": "localhost",
    "port": 1433,
    "database": "SampleDB",
    "user": "sa",
    "password": "password",
    "options": {
      "encrypt": false,
      "trustServerCertificate": true
    }
  },
  "mysqlDB": {
    "type": "mysql",
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  },
  "mariaDB": {
    "type": "mariadb",
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  }
}
```

#### 혼합 데이터베이스 쿼리
단일 Excel 파일에서 다양한 데이터베이스 타입을 쿼리할 수 있습니다:

**XML 예제:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries>
  <excel output="output/mixed_report.xlsx" db="mssqlDB" style="modern">
  </excel>

  <!-- MSSQL 데이터베이스 쿼리 -->
  <sheet name="MSSQL 데이터" db="mssqlDB">
    <query>
      SELECT TOP 10 * FROM Customers
    </query>
  </sheet>

  <!-- MySQL 데이터베이스 쿼리 -->
  <sheet name="MySQL 데이터" db="mysqlDB">
    <query>
      SELECT * FROM products LIMIT 10
    </query>
  </sheet>

  <!-- MariaDB 데이터베이스 쿼리 -->
  <sheet name="MariaDB 데이터" db="mariaDB">
    <query>
      SELECT * FROM orders 
      WHERE order_date >= '2024-01-01'
      LIMIT 20
    </query>
  </sheet>
</queries>
```

**JSON 예제:**
```json
{
  "excel": {
    "output": "output/mixed_report.xlsx",
    "db": "mssqlDB",
    "style": "modern"
  },
  "sheets": [
    {
      "name": "MSSQL 데이터",
      "db": "mssqlDB",
      "query": "SELECT TOP 10 * FROM Customers"
    },
    {
      "name": "MySQL 데이터",
      "db": "mysqlDB",
      "query": "SELECT * FROM products LIMIT 10"
    },
    {
      "name": "MariaDB 데이터",
      "db": "mariaDB",
      "query": "SELECT * FROM orders WHERE order_date >= '2024-01-01' LIMIT 20"
    }
  ]
}
```

#### 데이터베이스별 기능
- **MSSQL**: `TOP N` 절, `GETDATE()` 함수 지원
- **MySQL/MariaDB**: `LIMIT N` 절, `NOW()` 함수 지원
- **전체**: 각 데이터베이스 타입에 대한 자동 구문 처리

#### 데이터베이스 연결 테스트
구성된 모든 데이터베이스 연결을 테스트하세요:
```bash
# 개발 환경
node src/excel-cli.js list-dbs

# 독립 실행 파일
sql2excel-v1.3.0.exe list-dbs
```

#### 런타임 DB 선택 우선순위 (v2.1.5+)

- 기본 DB 키: CLI `--db` > `excel.db`
- 시트별: `sheet.db`가 기본 DB를 오버라이드
- 동적 변수: `dynamicVar.database` 또는 `dynamicVar.db`가 기본 DB를 오버라이드
- 팁: 내보내기 전에 위 `list-dbs`로 연결 상태를 점검하세요

### 2. 엑셀 스타일링

#### 글꼴 스타일링
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

#### 기본 쿼리 재사용
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

#### 파라미터 오버라이드 기능

동일한 쿼리 정의를 여러 시트에서 사용하면서 각각 다른 파라미터 값을 적용할 수 있습니다.

##### XML에서 파라미터 오버라이드
```xml
<queryDefs>
  <queryDef id="customer_base" description="기본 고객 쿼리">
    <![CDATA[
      SELECT CustomerID, CustomerName, Email, Phone, Region
      FROM Customers 
      WHERE IsActive = 1 
        AND Region IN (${regionList})
        AND CreatedDate >= '${startDate}'
    ]]>
  </queryDef>
</queryDefs>

<sheets>
  <!-- 서울 고객 -->
  <sheet name="SeoulCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Seoul"]</param>
      <param name="startDate">2024-01-01</param>
    </params>
  </sheet>
  
  <!-- 부산 고객 -->
  <sheet name="BusanCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Busan"]</param>
      <param name="startDate">2024-03-01</param>
    </params>
  </sheet>
  
  <!-- 모든 지역 고객 -->
  <sheet name="AllCustomers" use="true" queryRef="customer_base">
    <params>
      <param name="regionList">["Seoul", "Busan", "Daegu", "Incheon"]</param>
      <param name="startDate">2024-01-01</param>
    </params>
  </sheet>
</sheets>
```

##### JSON에서 파라미터 오버라이드
```json
{
  "queryDefs": {
    "customer_base": {
      "name": "customer_base",
      "description": "기본 고객 쿼리",
      "query": "SELECT CustomerID, CustomerName, Email, Phone, Region FROM Customers WHERE IsActive = 1 AND Region IN (${regionList}) AND CreatedDate >= '${startDate}'"
    }
  },
  "sheets": [
    {
      "name": "SeoulCustomers",
      "use": true,
      "queryRef": "customer_base",
      "params": {
        "regionList": ["Seoul"],
        "startDate": "2024-01-01"
      }
    },
    {
      "name": "BusanCustomers",
      "use": true,
      "queryRef": "customer_base",
      "params": {
        "regionList": ["Busan"],
        "startDate": "2024-03-01"
      }
    }
  ]
}
```

##### 파라미터 우선순위
1. **시트별 파라미터** (최우선)
2. **전역 변수** (vars 섹션)
3. **기본값** (쿼리 정의에 하드코딩됨)

##### 지원되는 파라미터 유형
- **문자열**: `"Seoul"`
- **숫자**: `1000`
- **배열**: `["Seoul", "Busan"]`
- **부울**: `true`, `false`
- **날짜**: `"2024-01-01"`


### 3. 별도 목차

독립 실행 TOC 파일 생성:

#### XML 구성
```xml
<queries>
  <excel db="sampleDB" output="output/Report.xlsx">
```

#### CLI 옵션
```bash
node src/excel-cli.js export --xml queries.xml
```

### 4. 데이터베이스 소스 정보

각 시트에는 데이터베이스 소스 정보가 포함됩니다:

```
📊 출처: sampleDB DB
```

## 📦 빌드 및 배포

### 독립 실행 파일 빌드

#### 1. 단일 실행 파일 빌드
```bash
# 버전이 포함된 실행 파일 빌드 (예: sql2excel-v1.2.5.exe)
npm run build
```

이것은 `dist/` 디렉토리에 다음을 포함하는 독립 실행 파일을 생성합니다:
- 모든 Node.js 의존성
- 소스 코드
- 구성 템플릿
- 스타일 템플릿
- **버전이 포함된 파일명**: `package.json`의 현재 버전이 자동으로 포함됩니다
- **에셋 번들링**: 엑셀 템플릿과 스타일 파일이 실행 파일 내에 번들됩니다

#### 2. 릴리스 패키지 생성
```bash
# 다국어 지원과 함께 완전한 릴리스 패키지 생성
npm run release
```

이것은 다음을 포함하는 포괄적인 릴리스 패키지를 생성합니다:

**한국어 릴리스 패키지** (`sql2excel-v{version}-ko/`):
- 독립 실행 파일 (`sql2excel-v{version}.exe`)
- 한국어 대화형 배치 파일 (`sql2excel.bat`)
- 구성 파일 (`config/dbinfo.json`)
- 샘플 쿼리 파일 (`queries/`)
- 스타일 템플릿 (`templates/`)
- 한국어 문서 (`user_manual/`)
- 한국어 배포 정보 (`배포정보.txt`)
- 라이센스 및 변경 이력

**영어 릴리스 패키지** (`sql2excel-v{version}-en/`):
- 독립 실행 파일 (`sql2excel-v{version}.exe`)
- 영어 대화형 배치 파일 (`sql2excel.bat`)
- 구성 파일 (`config/dbinfo.json`)
- 샘플 쿼리 파일 (`queries/`)
- 스타일 템플릿 (`templates/`)
- 영어 문서 (`user_manual/`)
- 영어 배포 정보 (`RELEASE_README.txt`)
- 라이센스 및 변경 이력

#### 3. 빌드 아티팩트 정리
```bash
# 모든 빌드 아티팩트 및 릴리스 패키지 제거
npm run clean
```

### 릴리스 패키지 구조

```
sql2excel-v{version}/
├── sql2excel.exe          # 독립 실행 파일
├── sql2excel.bat                  # 대화형 배치 인터페이스
├── config/
│   └── dbinfo.json               # 데이터베이스 구성
├── queries/                      # 샘플 쿼리 파일
│   ├── queries-sample.xml
│   ├── queries-sample.json
│   └── ...
├── templates/
│   └── excel-styles.xml          # 스타일 템플릿
├── user_manual/
│   ├── USER_MANUAL_KR.md         # 이 매뉴얼
│   └── CHANGELOG_KR.md           # 버전 히스토리
├── README_KR.md                  # 빠른 시작 가이드
├── 배포정보.txt                   # 릴리스 정보
└── LICENSE                       # 라이센스 파일
```

### 배포 옵션

#### 옵션 1: 독립 실행 패키지
- **대상**: Node.js 없는 최종 사용자
- **내용**: 완전한 실행 파일 패키지
- **사용법**: `sql2excel.bat` 실행 또는 `sql2excel-v{version}.exe` 직접 사용

#### 옵션 2: 소스 코드 패키지
- **대상**: 개발자 및 고급 사용자
- **내용**: Node.js 의존성이 있는 전체 소스 코드
- **사용법**: `npm install` 후 npm 스크립트 또는 Node.js 명령 사용

### 다국어 지원

릴리스 시스템은 다국어 패키지를 지원합니다:

#### 한국어 패키지 (`sql2excel-v{version}-ko/`)
- 한국어 배치 인터페이스
- 한국어 문서 (`배포정보.txt`)
- 한국어 오류 메시지 및 프롬프트

#### 영어 패키지 (`sql2excel-v{version}-en/`)
- 영어 배치 인터페이스
- 영어 문서 (`RELEASE_INFO.txt`)
- 영어 오류 메시지 및 프롬프트

## 🔧 CLI 명령 참조

### 주요 명령

| 명령 | 설명 | 옵션 |
|------|------|------|
| `export` | 엑셀 파일 생성 | `--xml`, `--query`, `--style`, `--var` |
| `validate` | 구성 파일 유효성 검사 | `--xml`, `--query` |
| `list-dbs` | 사용 가능한 데이터베이스 목록 | 없음 |
| `list-styles` | 사용 가능한 템플릿 스타일 목록 | 없음 |

### 내보내기 옵션

| 옵션 | 설명 | 예제 |
|------|------|------|
| `--xml <file>` | XML 쿼리 정의 파일 | `--xml queries.xml` |
| `--query <file>` | JSON 쿼리 정의 파일 | `--query queries.json` |
| `--style <style>` | 사용할 템플릿 스타일 | `--style modern` |
| `--var <key=value>` | 변수 값 설정 | `--var "year=2024"` |
| `--config <file>` | 데이터베이스 구성 파일 | `--config config/dbinfo.json` |
| `--db <dbname>` | 기본 데이터베이스 | `--db sampleDB` |

### 예제

#### 개발 환경
```bash
# XML을 사용한 기본 내보내기
node src/excel-cli.js export --xml queries/sales.xml

# 템플릿 스타일과 함께 내보내기
node src/excel-cli.js export --xml queries/sales.xml --style business

# 변수와 함께 내보내기
node src/excel-cli.js export --xml queries/sales.xml --var "year=2024" --var "region=North"

# 구성 유효성 검사
node src/excel-cli.js validate --xml queries/sales.xml

# 사용 가능한 스타일 목록
node src/excel-cli.js list-styles
```

#### 독립 실행 파일
```bash
# XML을 사용한 기본 내보내기
sql2excel.exe export --xml queries/sales.xml

# 템플릿 스타일과 함께 내보내기
sql2excel.exe export --xml queries/sales.xml --style business

# 변수와 함께 내보내기
sql2excel.exe export --xml queries/sales.xml --var "year=2024" --var "region=North"

# 구성 유효성 검사
sql2excel.exe validate --xml queries/sales.xml

# 사용 가능한 스타일 목록
sql2excel.exe list-styles
```

#### 대화형 배치 파일
```bash
# 대화형 메뉴 실행
sql2excel.bat

# 프롬프트를 따르세요:
# 1. 옵션 선택 (1-5)
# 2. 프롬프트가 나타나면 파일 경로 입력
# 3. 결과 검토
```

## 📊 예제

### 완전한 XML 예제
```xml
<?xml version="1.0" encoding="UTF-8"?>
<queries maxRows="5000">
  <excel db="sampleDB" output="output/SalesReport.xlsx" style="business">
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
    "maxRows": 5000
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
**해결 방법**: 
- `config/dbinfo.json` 구성 확인
- 네트워크 연결 확인
- 적절한 데이터베이스 권한 확인

#### 2. 변수 해석 오류
**문제**: 변수가 올바르게 해석되지 않음
**해결 방법**:
- 변수 구문 확인 (${varName})
- 변수 이름이 정확히 일치하는지 확인
- 변수 참조의 오타 확인
- 디버그 모드 활성화: `DEBUG_VARIABLES=true`

#### 3. 동적 변수 오류
**문제**: 동적 변수가 해석되지 않음
**해결 방법**:
- 변수 쿼리 구문 확인
- 사용 시 변수 이름 확인
- 변수 쿼리에 대한 데이터베이스 권한 확인
- 변수 유형 구성 검토

#### 4. 파일 권한 오류
**문제**: 출력 파일을 작성할 수 없음
**해결 방법**:
- 출력 디렉토리 권한 확인
- 출력 디렉토리가 존재하는지 확인
- 열린 엑셀 파일 닫기

#### 5. 메모리 문제
**문제**: 대용량 데이터셋에서 메모리 부족 오류
**해결 방법**:
- `limit` 속성을 사용하여 행 개수 제한
- 더 작은 청크로 데이터 처리
- Node.js 메모리 제한 증가

#### 6. 템플릿 스타일을 찾을 수 없음
**문제**: 템플릿 스타일이 로드되지 않음
**해결 방법**:
- `templates/excel-styles.xml` 파일이 존재하는지 확인
- 스타일 ID 철자 확인
- `list-styles` 명령을 사용하여 사용 가능한 스타일 확인

#### 7. 실행 파일을 찾을 수 없음 (독립 실행)
**문제**: `sql2excel-v*.exe 파일을 찾을 수 없음` 오류
**해결 방법**:
- 실행 파일이 `sql2excel.bat`와 동일한 디렉토리에 있는지 확인
- 실행 파일 이름이 버전과 일치하는지 확인 (예: `sql2excel.exe`)
- 파일이 누락된 경우 릴리스 패키지를 다시 압축 해제

#### 8. PowerShell 실행 정책 (Windows)
**문제**: PowerShell 실행 정책이 배치 파일 실행을 방지함
**해결 방법**:
- 관리자 권한으로 명령 프롬프트 실행
- PowerShell 대신 `cmd` 사용
- 또는 PowerShell 실행 정책 설정: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### 9. 의존성 누락 (개발)
**문제**: 개발 중 모듈을 찾을 수 없음 오류
**해결 방법**:
- `npm install`을 실행하여 의존성 설치
- Node.js 버전 확인 (16.0+ 필요)
- npm 캐시 정리: `npm cache clean --force`

#### 11. DateTime 변수가 작동하지 않음
**문제**: `${DATE.KST:YYYY-MM-DD}`와 같은 DateTime 변수가 엑셀에 값을 표시하지 않음
**해결 방법**:
- 변수 구문 확인 (문서의 정확한 변수 이름 사용)
- 변수가 변수 정의가 아닌 쿼리에서 사용되는지 확인
- 변수 치환을 확인하려면 디버그 모드 활성화: `DEBUG_VARIABLES=true`
- 변수 처리 순서가 올바른지 확인

#### 12. 파일 경로 입력 문제 (배치 인터페이스)
**문제**: 배치 인터페이스 사용 시 "파일을 찾을 수 없음" 오류
**해결 방법**:
- 파일 경로에서 앞뒤 공백 제거
- 탭 완성 또는 복사-붙여넣기를 사용하여 오타 방지
- 파일 확장자 확인 (.xml vs .json)
- 지정된 위치에 파일이 존재하는지 확인

#### 13. 목차에서 SQL 쿼리 포맷팅 문제
**문제**: SQL 쿼리가 목차에서 단일 줄로 나타남
**해결 방법**:
- 이것은 v1.2.4+에서 자동으로 유지됩니다
- 줄바꿈이 있는 원본 SQL 포맷이 유지됩니다
- 구성이 필요 없습니다 - 자동으로 작동합니다

#### 14. 생성 타임스탬프가 나타나지 않음
**문제**: 엑셀 시트에 생성 타임스탬프가 표시되지 않음
**해결 방법**:
- 이 기능은 v1.2.4+에서 자동입니다
- 최신 버전을 사용하고 있는지 확인
- 타임스탬프는 각 시트 상단에 자동으로 나타납니다
- 구성이 필요 없습니다

### 디버그 모드
자세한 변수 치환을 확인하려면 디버그 모드를 활성화하세요:

#### 개발 환경
```bash
DEBUG_VARIABLES=true node src/excel-cli.js export --xml ./queries/sample.xml
```

#### 독립 실행 파일
```bash
# 환경 변수 설정 후 실행
set DEBUG_VARIABLES=true
sql2excel.exe export --xml ./queries/sample.xml
```

### 오류 복구
1. **로그 확인**: 오류 세부 정보에 대한 콘솔 출력 검토
2. **구성 유효성 검사**: `validate` 명령 사용
3. **연결 테스트**: `list-dbs` 명령 사용
4. **쿼리 단순화**: 먼저 간단한 쿼리로 테스트
5. **파일 권한 확인**: 적절한 파일 액세스 권한 확인

## 📞 지원

- **문서**: 프로젝트 문서 참조
- **이슈**: GitHub를 통해 이슈 보고
- **이메일**: sql2excel.nodejs@gmail.com
- **웹사이트**: www.sql2excel.com

