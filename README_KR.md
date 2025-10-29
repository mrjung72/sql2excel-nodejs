# SQL2Excel - SQL 쿼리 결과로 엑셀 파일 생성

SQL 쿼리 결과를 엑셀 파일로 생성하는 Node.js 기반 도구입니다.

### 주요 기능
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
- ⏰ **커스텀 DateTime 변수**: 전세계 22개 타임존 지원 및 커스텀 포맷 (`${DATE.UTC:YYYY-MM-DD}`, `${DATE.KST:YYYY년 MM월 DD일}`, `${DATE.EST:YYYY-MM-DD HH:mm}` 등) 또는 로컬 시간 사용 (`${DATE:YYYY-MM-DD}`)
- 📋 **SQL 쿼리 포맷팅**: 목차에서 줄바꿈을 포함한 원본 SQL 포맷 유지
- 🔧 **입력 유효성 검증**: 파일 경로 입력에 대한 자동 공백 제거
- 🗂️ **파일명 변수**: `excel.output`에서 `${DATE:...}`, `${DATE.TZ:...}`, `${DB_NAME}` 사용 가능 (커스텀 `$(DB_NAME}`도 지원)

## v1.3.1 하이라이트

- 출력 경로에서 파일명 변수 지원 강화
  - `${DB_NAME}` 지원 (현재 기본 DB 키). 커스텀 문법 `$(DB_NAME}`는 자동으로 `${DB_NAME}`로 정규화
  - `${DATE:...}`(로컬 시간), `${DATE.TZ:...}`(타임존 명시) 파일명에서 사용 가능
  - 소문자 날짜 토큰 지원: `yyyy, yy, dd, d, hh, h, sss`
  - 자동 `_yyyymmddhhmmss` 접미사 제거 → DATE 변수로 직접 제어

## v1.3.0 하이라이트

- **확장자 기반 시트별 내보내기 라우팅**
  - `.xlsx` / `.xls` → 단일 엑셀 통합문서 생성 (기존 동작)
  - `.csv` → 시트별 CSV 파일 생성
  - 그 외 모든 확장자(예: `.txt`, `.log`, `.data`, `.sql` 등) → 시트별 TXT 파일 생성 (탭 구분)
- **시트별 내보내기 디렉토리/파일명 규칙**
  - 출력 디렉토리: `<출력파일베이스>_<확장자>` (점 제외). 예: `output="d:/temp/report.csv"` → `d:/temp/report_csv/`
  - 각 시트는 `originalName`(원본 시트명)으로 파일 생성
  - CSV/TXT는 31자 제한 없음(엑셀 전용 제한). 파일명은 안전화 및 최대 100자 제한
- **포맷 기본값**
  - CSV: 콤마, UTF-8 BOM, 헤더 포함, CRLF
  - TXT: 탭, UTF-8 BOM, 헤더 포함, CRLF

### 이전 버전(v1.2.11)

- 시트명 31자 초과 경고 처리 및 엑셀에서 잘릴 수 있음 안내
- TOC: "Original Name" 컬럼 추가, Note(툴팁) 제거

### 이전 버전(v1.2.10)

- **비대화식 CLI**: 메뉴 없이 `app.js --mode`로 직접 실행
  - 모드: `validate`, `test`, `export`, `help`
  - Node 실행 및 배포 EXE 모두 지원

### 비대화형 CLI (신규)

#### Node.js
```bash
# 쿼리정의 검증
node app.js --mode=validate --xml=./queries/sample-queries.xml
# 또는 JSON
node app.js --mode=validate --query=./queries/sample-queries.json

# DB 연결 테스트
node app.js --mode=test

# 엑셀 생성
node app.js --mode=export --xml=./queries/sample-queries.xml
# 또는 JSON
node app.js --mode=export --query=./queries/sample-queries.json

# 도움말
node app.js --mode=help
```

#### 독립 실행 파일(EXE)
```bash
sql2excel.exe --mode=validate --xml=./queries/sample-queries.xml
sql2excel.exe --mode=test
sql2excel.exe --mode=export --xml=./queries/sample-queries.xml
sql2excel.exe --mode=help
```

## 🚀 빠른 시작

## 🛠️ 설치 및 설정

### 1. 시스템 요구사항

#### 개발/소스 코드 사용 시
- Node.js 16.0 이상
- SQL Server 2012 이상
- 적절한 데이터베이스 권한

#### 독립 실행 파일 사용 시
- Windows 10 이상 (64비트)
- SQL Server 2012 이상
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


## 📚 문서

자세한 사용법 및 고급 기능은 다음 문서를 참조하세요:

- **📖 [사용자 매뉴얼](USER_MANUAL_KR.md)** - 전체 사용 가이드
- **📋 [변경 이력](CHANGELOG_KR.md)** - 버전별 변경사항

## 💡 사용 예제

### XML 구성 파일 예제 (동적 변수 포함)
```xml
<queries>
  <excel db="sampleDB" output="output/SalesReport.xlsx">
    <header>
      <font name="Arial" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
    </header>
  </excel>
  
  <!-- 일반 변수 -->
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-12-31</var>
  </vars>
  
  <!-- 동적 변수 -->
  <dynamicVars>
    <dynamicVar name="activeCustomers" description="활성 고객 목록">
      <![CDATA[
        SELECT CustomerID, CustomerName, Region
        FROM Customers WHERE IsActive = 1
      ]]>
    </dynamicVar>
  </dynamicVars>
  
  <sheet name="MonthlySales" use="true" aggregateColumn="Month">
    <![CDATA[
      SELECT MONTH(OrderDate) as Month, SUM(TotalAmount) as Sales
      FROM Orders 
      WHERE YEAR(OrderDate) = 2024
        AND CustomerID IN (${activeCustomers.CustomerID})
      GROUP BY MONTH(OrderDate)
    ]]>
  </sheet>
</queries>
```

### 변수 사용 예제
```bash
node src/excel-cli.js export --xml ./queries/sales-report.xml \
  --var "startDate=2024-01-01" \
  --var "endDate=2024-06-30"
```

## 동적 변수

이 도구는 런타임에 데이터를 추출하여 쿼리에서 사용할 수 있는 동적 변수를 지원합니다:

### 변수 유형

| 유형 | 설명 | 액세스 패턴 | 기본값 |
|------|------|-------------|--------|
| `column_identified` | 모든 컬럼을 컬럼명으로 키가 지정된 배열로 추출 | `${varName.columnName}` | ✅ 예 |
| `key_value_pairs` | 처음 두 컬럼을 키-값 쌍으로 추출 | `${varName.key}` | 아니오 |

### 사용 예제

```xml
<!-- column_identified 사용 (기본값) -->
<dynamicVar name="customerData" description="고객 정보">
  <![CDATA[
    SELECT CustomerID, CustomerName, Region FROM Customers
  ]]>
  <!-- type 생략 - column_identified가 기본값 -->
</dynamicVar>

<!-- key_value_pairs 사용 -->
<dynamicVar name="statusMapping" description="상태 매핑">
  <![CDATA[
    SELECT StatusCode, StatusName FROM StatusCodes
  ]]>
  <type>key_value_pairs</type>
</dynamicVar>
```

```sql
-- 시트 쿼리에서 사용
SELECT * FROM Orders 
WHERE CustomerID IN (${customerData.CustomerID})
  AND Status IN (${statusMapping.StatusCode})
```

## 🔧 환경 요구사항

- Node.js 16.0 이상
- SQL Server 2012 이상
- 적절한 데이터베이스 권한

## 📞 지원

- **웹사이트**: www.sql2excel.com
- **이메일**: sql2excel.nodejs@gmail.com

