# SQL2Excel 버전 히스토리

## v2.1.5-beta(v1.3.5) - 동적 변수 DB 라우팅 & XML 검증 업데이트 (2025-11-15)

### ✨ 변경 사항
- 동적 변수 DB 라우팅
  - XML `dynamicVar`에서 `db` 속성 지원 (`database`의 별칭)
  - 각 동적 변수는 지정된 DB 키의 어댑터로 실행
  - 미지정 시 전역 기본 DB로 폴백
- XML 검증 업데이트
  - XML 구조 검증에서 `queryDef`의 `db` 속성을 허용 (문서/향후 확장용). 실제 실행 DB는 시트의 `db` 또는 전역 기본 DB가 적용됨

### 🔧 코드 변경
- `src/query-parser.js`
  - `dynamicVar`에 `db` 속성 허용; 파싱 시 `database || db` 처리
  - XML 검증에서 `queryDef`의 `db` 속성 허용
- `src/variable-processor.js`
  - 동적 변수를 해당 DB 어댑터로 실행 (`dbAdapters[targetDbKey]`)
- `src/index.js`
  - 동적 변수 처리에 `dbAdapters`와 `defaultDbKey` 전달

### 📝 문서
- README/README_KR: v2.1.5 하이라이트, `dynamicVar`의 `db`/`database` 속성 사용 노트 및 예시 추가
- USER_MANUAL/USER_MANUAL_KR: 동적 변수 속성 및 변수별 DB 라우팅 동작 문서화
- CHANGELOG/CHANGELOG_KR: v2.1.5 항목 추가

## v2.1.4-beta(v1.3.4) - DB 어댑터 테스트 쿼리 도입 및 스키마 정합성 (2025-11-08)

### ✨ 변경 사항
- 어댑터 단위 연결 테스트 SQL 도입
  - 모든 DB 어댑터에 `getTestQuery()` 추가
    - MSSQL: `SELECT 1 as test`
    - MySQL/MariaDB: `SELECT 1 as test`
    - PostgreSQL: `SELECT 1`
    - SQLite: `SELECT 1`
    - Oracle: `SELECT 1 FROM dual`
  - `excel-cli.js`는 연결 검증 시 어댑터의 `getTestQuery()`를 사용

- 샘플 스키마 정합성(Orders)
  - PostgreSQL: `SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID` 추가
  - MySQL: `SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID` 추가
  - 목적: 샘플 데이터 컬럼과 일치 및 MSSQL 스키마와의 정합성 향상

### 🐛 버그 수정
- Oracle 연결 검증 오류 수정 (`list-dbs`/검증 플로우)
  - 하드코딩된 `SELECT 1 as test` → 어댑터 제공 테스트 쿼리로 대체
- `excel-cli.js`: `loadDatabaseConfig()`의 깨진 `catch` 블록 수정 및 오류 메시지 개선(`configFileLoadFailed`)

### 🔧 코드 변경
- `src/database/OracleAdapter.js`: `getTestQuery()` 추가
- `src/database/MSSQLAdapter.js`: `getTestQuery()` 추가
- `src/database/MySQLAdapter.js`: `getTestQuery()` 추가
- `src/database/PostgreSQLAdapter.js`: `getTestQuery()` 추가
- `src/database/SQLiteAdapter.js`: `getTestQuery()` 추가
- `src/excel-cli.js`: 어댑터의 테스트 쿼리 사용; `loadDatabaseConfig()` catch 블록 수정
- `resources/create_sample_tables_postgresql.sql`: Orders 컬럼 추가 (`SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`)
- `resources/create_sample_tables_mysql.sql`: Orders 컬럼 추가 (`SubTotal`, `PaymentMethod`, `PaymentStatus`, `EmployeeID`)

### 📝 비고
- 본 변경으로 샘플 데이터(PostgreSQL)가 각 DB 스키마 적용 시 원활히 적재되도록 정합성이 개선되었습니다.

## v2.1.3-beta(v1.3.3) - 문서 동기화 및 버전 올림 (2025-10-31)

### ✨ 변경 사항
- 시트에서 특정 컬럼을 결과에서 제외하는 `exceptColumns` 속성 추가
  - XML: `<sheet name="..." exceptColumns="ColA, ColB">`와 같이 쉼표로 구분해 지정
  - JSON: `"exceptColumns": ["ColA", "ColB"]` 또는 `"except_columns": ["ColA", "ColB"]` 지원
  - 대소문자 구분 없이 키 탐색, 하위 호환으로 `except_columns`도 인식
- 동작: 내보내기 전에 지정된 컬럼을 레코드셋에서 제거하여 파일(Excel/CSV/TXT)에 포함되지 않도록 처리
- 예시:
  ```sql
  <sheet name="사용자 목록" exceptColumns="password, email">
    SELECT * FROM users
  </sheet>
  ```

### 🔧 코드 변경
- `src/query-parser.js`: XML/JSON에서 `exceptColumns`(및 `except_columns`) 파싱하여 배열로 표준화
- `src/index.js`: 시트 정의의 `exceptColumns`가 있으면 해당 컬럼들을 결과에서 제거하는 전처리 적용

### 📝 문서
- KR/EN 문서(README, USER_MANUAL, CHANGELOG) 동기화
- 패키지 버전을 1.3.3으로 업데이트

## v2.1.1-beta(v1.3.1) - 파일명 변수 및 DATE 개선 (2025-10-30)

### ✨ 변경 사항
- 출력 파일명 변수 기능 강화
  - `excel.output`에서 `${DB_NAME}` 사용 지원 (커스텀 문법 `$(DB_NAME}` → `${DB_NAME}`로 자동 정규화)
  - 타임존 미지정 `${DATE:...}`는 서버 로컬 시간으로 치환
  - 타임존 지정 `${DATE.TZ:...}` 계속 지원
- 날짜 포맷 토큰 소문자 지원
  - 기존 대문자 토큰 외에 `yyyy, yy, dd, d, hh, h, sss` 지원 추가
  - 긴 토큰 → 짧은 토큰 순서로 안전 치환
- 자동 타임스탬프 접미사 제거
  - 파일명에 `_yyyymmddhhmmss` 자동 추가 제거; 필요 시 `excel.output`에 DATE 변수를 사용하세요

### 🔧 코드 변경
- `src/index.js`: 출력 경로 변수 치환 적용, `DB_NAME` 주입, `$(VAR}` → `${VAR}` 정규화, 자동 타임스탬프 추가 제거
- `src/mssql-helper.js`: 날짜 포맷터에 소문자 토큰 지원 추가, `formatDateLocal` 추가
- `src/variable-processor.js`: `${DATE:...}`(로컬 시간) 처리 시 `formatDateLocal` 사용

### 📝 문서
- README/README_KR: v1.3.1 하이라이트 및 파일명 변수 예시 추가
- USER_MANUAL/USER_MANUAL_KR: 파일명 변수(`DB_NAME`, DATE), 소문자 토큰, 로컬 시간 동작 설명 추가
- CHANGELOG/CHANGELOG_KR: v1.3.1 항목 추가

## v2.1.0-beta(v1.3.0) - CSV/TXT 시트별 내보내기 및 라우팅 규칙 (2025-10-29)

### ✨ 변경 사항
- 출력 확장자에 따른 라우팅
  - `.xlsx` / `.xls` → 단일 엑셀 통합문서 생성 (기존 동작)
  - `.csv` → 시트별 CSV 파일 생성
  - 그 외 모든 확장자(예: `.txt`, `.log`, `.data`, `.sql` 등) → 시트별 TXT 파일 생성 (탭 구분)
- 출력 디렉토리 명명 규칙
  - 시트별 내보내기 시 `<출력파일베이스>_<확장자>` (점 제외) 디렉토리 하위에 파일 생성
  - 예: `output="d:/temp/report.csv"` → 디렉토리 `d:/temp/report_csv/`
- 개별 파일명 규칙
  - 각 시트는 원본 시트명(`originalName`)을 파일명으로 사용 (파일시스템 안전화 적용)
  - CSV/TXT 출력에는 31자 제한(엑셀 전용 제한) 미적용
  - 파일명 최대 100자, 금지 문자는 `_`로 치환
- 데이터 형식 기본값
  - CSV: 콤마 구분, UTF-8 BOM, 헤더 포함, CRLF 줄바꿈
  - TXT: 탭 구분, UTF-8 BOM, 헤더 포함, CRLF 줄바꿈

### 🔧 코드 변경
- index.js: 확장자 기반 라우팅 — `.xlsx`/`.xls`만 통합문서 생성, `.csv`는 시트별 CSV, 기타는 시트별 TXT
- excel-generator.js: 시트별 파일 작성 로직 추가, 디렉토리/파일명 규칙 반영, 출력 포맷 기본값 적용

### 📝 문서
- README/README_KR: v1.3.0 하이라이트 및 시트별 내보내기 규칙/예시 반영
- USER_MANUAL/USER_MANUAL_KR: 라우팅, 디렉토리/파일명 규칙, 기본값 섹션 추가
- CHANGELOG/CHANGELOG_KR: v1.3.0 항목 추가

## v2.0.11-beta(v1.2.11) - TOC 원본 시트명 컬럼 및 시트명 길이 경고 (2025-10-29)

### ✨ 변경 사항
- 시트명 길이 31자 초과 시 이제 검증에서 오류가 아닌 경고로 처리합니다.
  - 경고 메시지에 엑셀에서 시트명이 잘릴 수 있음도 함께 안내합니다.
- 목차(TOC)에 "Original Name" 컬럼 추가
  - 엑셀 탭이 잘린 경우에도 원래 정의된 시트명을 별도 컬럼으로 표시
  - 기존 Note(툴팁) 표시는 제거하고 컬럼으로 노출

### 🔧 코드 변경
- excel-cli.js: 시트명 길이 초과 시 에러 → 경고 출력
- excel-style-helper.js: TOC 구조 변경 (Original Name 컬럼 추가, Note 컬럼 제거)
- index.js / excel-generator.js: 원본 시트명을 TOC로 전달

### 📝 문서
- README/README_KR: v1.2.11 하이라이트 및 변경점 반영
- CHANGELOG/CHANGELOG_KR: v1.2.11 항목 추가

## v2.0.10-beta(v1.2.10) - 비대화식 CLI 및 문서 업데이트 (2025-10-29)

### ✨ 새로운 기능

#### 비대화식 CLI (app.js)
- `--mode` 플래그로 대화형 메뉴 없이 직접 실행 가능
  - 모드: `validate`, `test`, `export`, `help`
  - Node 환경과 패키지 EXE 모두 지원

### 📝 문서
- README.md / README_KR.md: "비대화식 CLI" 사용법과 예시 추가


## v2.0.0-beta - 다중 데이터베이스 지원 (2025-10-22)

### ✨ 새로운 기능
- **다중 데이터베이스 지원**: MSSQL 외 다양한 데이터베이스 타입 지원
  - **지원 데이터베이스**: MSSQL, MySQL, MariaDB
  - **통합 인터페이스**: 모든 데이터베이스 타입에 대한 일관된 API
  - **데이터베이스 팩토리 패턴**: 데이터베이스 타입에 따라 자동으로 적절한 어댑터 선택
  - **하위 호환성**: 기존 MSSQL 설정은 변경 없이 그대로 작동

### 🔧 설정
```json
{
  "sampleDB": {
    "type": "mssql",      // 선택사항, 지정하지 않으면 "mssql" 기본값 사용
    "server": "localhost",
    "port": 1433,
    "database": "SampleDB",
    "user": "sa",
    "password": "password"
  },
  "mysqlDB": {
    "type": "mysql",      // 신규: MySQL 지원
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  },
  "mariaDB": {
    "type": "mariadb",    // 신규: MariaDB 지원
    "server": "localhost",
    "port": 3306,
    "database": "mydb",
    "user": "root",
    "password": "password"
  }
}
```

### 📦 기술적 변경사항
- **새로운 아키텍처**:
  - `src/database/DatabaseFactory.js`: 데이터베이스 어댑터 생성 팩토리
  - `src/database/MSSQLAdapter.js`: MSSQL 구현 (mssql-helper.js에서 리팩토링)
  - `src/database/MySQLAdapter.js`: MySQL/MariaDB 구현
  
- **업데이트된 파일**:
  - `src/index.js`: MSSQLHelper 대신 DatabaseFactory 사용
  - `src/variable-processor.js`: 데이터베이스 독립적인 구현
  - `package.json`: `mysql2` 의존성 추가

### 🔄 데이터베이스별 특징
- **MSSQL**: 
  - 행 제한에 `TOP N` 사용
  - `GETDATE()` 함수 지원
  
- **MySQL/MariaDB**: 
  - 행 제한에 `LIMIT N` 사용
  - `GETDATE()`를 `NOW()`로 자동 변환
  - 자동 재연결 기능이 있는 연결 풀링

### 💡 사용 예시
```xml
<!-- 하나의 엑셀 파일에 다양한 데이터베이스 타입 혼합 -->
<excel output="multi_db_report_${DATE.UTC:YYYYMMDD}.xlsx" db="mysqlDB">
  <sheet name="MySQL 사용자" db="mysqlDB">
    <query>SELECT * FROM users</query>
  </sheet>
  
  <sheet name="MSSQL 주문" db="sampleDB">
    <query>SELECT * FROM orders</query>
  </sheet>
  
  <sheet name="MariaDB 제품" db="mariaDB">
    <query>SELECT * FROM products</query>
  </sheet>
</excel>
```

### ⚠️ 참고사항
- **Type 필드**: 데이터베이스 설정의 `type` 필드는 선택사항입니다. 생략하면 하위 호환성을 위해 `mssql`을 기본값으로 사용합니다.
- **포트 번호**: 지정하지 않으면 기본 포트를 사용합니다 (MSSQL: 1433, MySQL/MariaDB: 3306)
- **연결 풀링**: 모든 데이터베이스 타입은 최적의 성능을 위해 연결 풀링을 사용합니다

### 📚 의존성
- 추가: `mysql2@^3.6.0` - Promise 지원이 포함된 MySQL/MariaDB 드라이버
- 유지: `mssql@^10.0.0` - Microsoft SQL Server 드라이버

---

## v1.2.9 - 글로벌 타임존 시스템 및 로컬 시간 지원 (2025-10-21)

### ✨ 새로운 기능
- **글로벌 타임존 시스템**: 전세계 22개 타임존 지원
  - 새로운 문법: `${DATE.<TIMEZONE>:format}` (타임존 명시) 또는 `${DATE:format}` (로컬 시간)
  - 아시아-태평양: UTC, GMT, KST, JST, CST, SGT, PHT, ICT, IST, AEST
  - 유럽/중동: CET(독일, 프랑스, 이탈리아, 폴란드), EET, GST
  - 아메리카: EST, AST, CST_US(미국, 캐나다, 멕시코), MST, PST, AKST, HST, BRT, ART
  - 지원 토큰: `YYYY`, `YY`, `MM`, `M`, `DD`, `D`, `HH`, `H`, `mm`, `m`, `ss`, `s`, `SSS`

- **로컬 시간 지원**: 타임존 생략 시 서버의 로컬 시간 자동 사용
  - `${DATE:YYYY-MM-DD}` - 서버의 로컬 타임존 시간 사용
  - 권장사항: 글로벌 일관성을 위해 타임존 명시 권장

### 🌍 타임존별 사용 예시
```
${DATE.UTC:YYYY-MM-DD}                 → 2024-10-21 (UTC 시간)
${DATE.KST:YYYY년 MM월 DD일}           → 2024년 10월 22일 (한국 시간)
${DATE.JST:YYYY年MM月DD日}             → 2024年10月22日 (일본 시간)
${DATE.EST:YYYY-MM-DD HH:mm:ss}        → 2024-10-21 10:30:45 (미국 동부)
${DATE.CET:DD.MM.YYYY HH:mm}           → 21.10.2024 16:30 (중앙유럽)
${DATE.PHT:YYYY/MM/DD HH:mm}           → 2024/10/21 23:30 (필리핀)
${DATE.ICT:YYYY-MM-DD HH:mm}           → 2024-10-21 22:30 (태국/베트남)
${DATE:YYYYMMDD_HHmmss}                → 20241021_183045 (로컬 시간)
```

### 🔧 개선사항
- **확장성 향상**: 고정된 날짜 포맷에서 벗어나 자유로운 타임존 및 포맷 지정 가능
- **타임존 명시화**: 타임존을 변수명에 명시하여 혼란 방지 (`DATE.UTC`, `DATE.KST` 등)
- **유연한 시간 처리**: 글로벌 보고서를 위한 다중 타임존 동시 표시 가능
- `src/variable-processor.js`: 
  - 22개 타임존 오프셋 설정 추가
  - 로컬 시간 처리 로직 추가
  - 타임존별 날짜 변수 파싱 로직 추가
- `src/mssql-helper.js`: `formatDate()` 함수로 날짜 포맷팅 로직 통합

### 💥 주요 변경사항 (Breaking Changes)
- **날짜 변수 형식 변경**: 타임존을 명시적으로 지정하는 방식으로 변경
  - 기존: `${DATE:format}`, `${DATETIME:format}`, `${KST:format}`
  - 신규: `${DATE.<TIMEZONE>:format}` 또는 `${DATE:format}` (로컬 시간)

### 🔄 마이그레이션 가이드
기존 변수를 새로운 글로벌 타임존 형식으로 변경하세요:
```
기존: ${DATE:YYYY-MM-DD}                   → 신규: ${DATE.UTC:YYYY-MM-DD} 또는 ${DATE:YYYY-MM-DD} (로컬)
기존: ${DATETIME:YYYY-MM-DD HH:mm:ss}      → 신규: ${DATE.UTC:YYYY-MM-DD HH:mm:ss}
기존: ${KST:YYYY-MM-DD}                    → 신규: ${DATE.KST:YYYY-MM-DD}
기존: ${KST:YYYY년 MM월 DD일}              → 신규: ${DATE.KST:YYYY년 MM월 DD일}
```

### 📝 예제 파일 업데이트
- `queries/datetime-variables-example.xml`: 글로벌 타임존 시스템으로 전면 재작성
- `queries/datetime-variables-example.json`: 글로벌 타임존 시스템으로 전면 재작성

### 📚 사용 예시
```sql
-- 파일명에 UTC 시간 사용
<excel output="report_${DATE.UTC:YYYYMMDD}_${DATE.UTC:HHmmss}.xlsx">

-- 파일명에 로컬 시간 사용
<excel output="report_${DATE:YYYYMMDD}_${DATE:HHmmss}.xlsx">

-- 글로벌 보고서 (다중 타임존 동시 표시)
SELECT 
  '서울: ${DATE.KST:YYYY-MM-DD HH:mm:ss}' as Seoul_Time,
  '뉴욕: ${DATE.EST:YYYY-MM-DD HH:mm:ss}' as NewYork_Time,
  '도쿄: ${DATE.JST:YYYY-MM-DD HH:mm:ss}' as Tokyo_Time,
  '파리: ${DATE.CET:YYYY-MM-DD HH:mm:ss}' as Paris_Time

-- 한국식 날짜 표시
SELECT '보고서 작성일: ${DATE.KST:YYYY년 MM월 DD일}' as Title

-- WHERE 조건에 타임존 사용
WHERE created_date >= '${DATE.KST:YYYY-MM-DD}'
  AND updated_time < '${DATE.KST:YYYY-MM-DD HH:mm:ss}'
```

### 🌏 신규 추가 타임존 (3개)
- **PHT** (Philippine Time, UTC+8): 필리핀
- **ICT** (Indochina Time, UTC+7): 태국, 베트남
- **AST** (Atlantic Standard Time, UTC-4): 캐나다 동부

## v1.2.8 - 언어 설정 개선 및 타입 안정성 향상 (2025-10-19)

### 🔧 개선사항
- **언어 설정 통일**: 모든 모듈에서 환경 변수(`LANGUAGE`)로 언어 설정 통일
  - `app.js`: 명령줄 인수 대신 환경 변수 사용
  - `src/index.js`: 환경 변수 기반 언어 설정
  - `src/excel-cli.js`: 환경 변수 사용, 기본값 'kr'에서 'en'으로 변경
  - `src/excel-style-helper.js`: 환경 변수 사용
  - `src/file-utils.js`: 환경 변수 사용
  - `src/style-manager.js`: 환경 변수 사용
  - `src/variable-processor.js`: 환경 변수 사용
  - `src/query-parser.js`: 환경 변수 사용
  - `src/excel-generator.js`: 환경 변수 사용

- **배치 파일 개선**: 환경 변수 설정 추가, `--lang` 파라미터 제거
  - `run.bat`: `set LANGUAGE=en` 추가
  - `실행하기.bat`: `set LANGUAGE=kr` 추가
  - `create-release.js`: 릴리스 배치 파일 템플릿에 환경 변수 설정 추가
  - `package.json`: `start:kr` 스크립트를 배치 파일 사용 안내 메시지로 변경

### 🐛 버그 수정
- **타입 변환 오류 해결**: IN 절에서 빈 배열 처리 시 타입 안정성 개선
  - `src/mssql-helper.js`: `createInClause()` 함수에서 `'^-_'` 대신 `NULL` 반환
  - `src/variable-processor.js`: 해결되지 않은 동적 변수를 `'^-_'` 대신 `NULL`로 대체
  - **문제**: INT 타입 컬럼에서 `WHERE OrderID IN ('^-_')` 실행 시 타입 변환 오류 발생
  - **해결**: `WHERE OrderID IN (NULL)` 사용으로 모든 데이터 타입에서 안전하게 작동
  - **효과**: 숫자, 문자열, 날짜 등 모든 타입의 컬럼에서 오류 없이 실행 (항상 0개 행 반환)

### 📝 문서
- 다국어 메시지 개선
  - `variable-processor.js`: NULL 대체 시 메시지에 `(매칭 없음)` / `(no match)` 표시
  - 빈 문자열 대체 시 메시지 명확화

### 🔄 마이그레이션 가이드
- 기존에 `node app.js --lang=kr` 형태로 실행하던 경우:
  - Windows: `set LANGUAGE=kr && node app.js`
  - 또는 `실행하기.bat` 사용 (자동으로 환경 변수 설정됨)
- 개발 환경에서는 `.env` 파일에 `LANGUAGE=kr` 설정 가능

## v1.2.7 - 인코딩 및 검증 개선 (2025-10-16)

### 🔧 개선사항
- **파일명 한글 검증 제거**: 파일명 한글 문자 검증 로직 제거
  - `file-utils.js`: `hasKoreanInFilename()` 및 `validateFilename()` 함수 제거
  - `query-parser.js`: `validateQueryFile()` 함수 제거
  - `index.js`: `validateQueryFile()` 호출 제거
  - 문서: 모든 한글 파일명 검증 관련 내용 제거

- **쿼리 파일 검증 개선**: 해당 쿼리 파일에서 사용하는 데이터베이스만 표시
  - `excel-cli.js`: `validateQueryFile()` 함수 개선
  - `<excel>`, `<sheet>`, `<dynamicVar>` 요소에서 DB ID 수집
  - 실제 사용하는 데이터베이스만 표시
  - 설정 파일에 없는 DB 참조 시 에러 표시

- **배포판 인코딩 수정**: 배포판 배치 파일 문자 깨짐 현상 해결
  - `create-release.js`: 배치 파일에서 한글 텍스트 제거
  - `app.js`: Windows용 UTF-8 인코딩 설정 추가
  - 배치 파일은 영문 메시지만 표시
  - Node.js 애플리케이션 시작 후 한글 인터페이스 정상 표시

- **쿼리 샘플 파일 영문화**: 모든 쿼리 샘플 파일을 영문으로 변환
  - `queries/queries-sample-orders.json`: 영문으로 변환
  - `queries/queries-sample-orders.xml`: 영문으로 변환
  - `queries/datetime-variables-example.json`: 영문으로 변환
  - `queries/datetime-variables-example.xml`: 영문으로 변환
  - `queries/queries-with-dynamic-variables.json`: 영문으로 변환
  - `queries/queries-with-dynamic-variables.xml`: 영문으로 변환
  - `queries/queries-with-template.xml`: 영문으로 변환
  - `queries/test-sheet-name-validation.xml`: 영문으로 변환

### 📝 문서
- 파일명 검증 기능 제거 내용 README에 반영
- 최신 변경사항을 USER_MANUAL에 업데이트

## v1.2.6 - 검증 및 구조 개선 (2025-10-15)

### ✨ 새로운 기능
- **시트명 검증**: Excel 시트명 유효성 검증 로직 추가
  - 허용되지 않는 문자 검증: `\`, `/`, `*`, `?`, `[`, `]`, `:`
  - 최대 길이 검증: 31자 제한
  - 앞뒤 공백 검증
  - 변수 치환 후 실제 시트명 검증

- **XML 구조 검증**: element명과 속성명 검증 로직 추가
  - 허용되는 element 검증
  - 허용되는 속성 검증
  - xml2js 내부 키 자동 제외 (`$`, `_` 등)
  - 상세한 에러 메시지 출력

- **인터랙티브 메뉴 시스템**: sql2db 스타일의 사용자 친화적 메뉴
  - `app.js`: 다국어 지원 메뉴 시스템
  - `run.bat`: 영어 버전 실행 스크립트 (`--lang=en`)
  - `실행하기.bat`: 한글 버전 실행 스크립트 (`--lang=kr`)

- **다국어 지원**: 명령줄 인수를 통한 언어 선택
  - `--lang=en`: 영문 인터페이스
  - `--lang=kr`: 한글 인터페이스
  - 메뉴, 메시지, 에러 모두 다국어 지원

### 🔧 기술적 개선
- **dbinfo.json 구조 개선**: dbs 래퍼 제거
  - 변경 전: `{"dbs": {"sampleDB": {...}}}`
  - 변경 후: `{"sampleDB": {...}}`
  - 더 간결한 구조로 가독성 향상

- **pkg 환경 경로 처리**: APP_ROOT 상수 사용
  - `mssql-connection-manager.js`: pkg 환경 경로 처리 추가
  - 모든 파일 경로를 APP_ROOT 기준으로 통일

- **pkg 빌드 최적화** (2025-10-15)
  - `--no-native-build` 옵션 제거: 네이티브 모듈 호환성 개선
  - 네이티브 모듈 명시적 포함: `mssql`, `tedious` assets 추가
  - 진입점 명시: `pkg app.js` 형태로 명확한 진입점 지정
  - Target 명시: `--target node18-win-x64` 명시적 지정
  - 압축 추가: `--compress GZip`로 파일 크기 최적화

- **pkg 환경 지원** (2025-10-15)
  - `app.js`에서 pkg 환경 감지 및 모듈 직접 호출
  - `excel-cli.js` 모듈 직접 require하여 기능 실행
  - Node.js 환경과 pkg 환경 자동 분기 처리
  - `process.argv` 동적 재구성으로 모듈 호출
  - `excel-cli.js`: args와 command를 main() 함수 내에서 동적 읽기
  - `file-utils.js`: APP_ROOT 기반 경로 처리 (pkg 환경 지원)
  - `index.js`: yargs를 매번 새로 생성하여 process.argv 명시적 전달

- **옵션 파싱 개선** (2025-10-15)
  - `excel-cli.js`에 `--lang` 옵션 처리 추가
  - 알 수 없는 옵션 무시 기능 추가 (`default` case)
  - 옵션 파서 안정성 향상
  - `yargs` 사용 방식 개선: `require('yargs/yargs')`로 변경
  - `process.argv.slice(2)` 명시적 전달로 pkg 환경 호환성 확보

### 🐛 버그 수정
- **queryDef 검증 오류**: queryDef의 id 속성 인식 개선
- **변수 치환 시트명 검증**: 변수 치환 후 시트명 검증으로 변경
- **validate 명령 옵션 파싱**: --xml 옵션 인식 개선
- **"i is not defined" 에러 수정** (2025-10-15)
  - `index.js`: for-of 루프에서 `sheetIndex` 변수 추가
  - 시트 처리 루프에서 인덱스 추적 로직 개선
  - 시트명 검증 함수 호출 시 올바른 인덱스 전달

- **파일 검증 시 시트명 검증 미적용 문제 수정** (2025-10-15)
  - `excel-cli.js`: 시트명 검증 로직을 queryDefs 블록 밖으로 이동
  - 검증이 항상 실행되도록 구조 개선
  - 검증 실패 시 명확한 에러 메시지와 함께 `false` 반환
  - 쿼리 실행 시에는 자동 수정, 파일 검증 시에는 검증 실패 처리

### 🎨 UI/UX 개선 (2025-10-15)
- **검증 결과 상세 출력**
  - 시트 목록: 개수만이 아닌 전체 목록 출력
  - 각 시트별 검증 결과: ✅ 성공 / ❌ 실패 표시
  - 실패 원인 상세 설명: 어떤 규칙을 위반했는지 명시
  - 데이터베이스 목록: 서버, DB명, 사용자, 권한 등 상세 정보 표시

- **배치 파일 실행 시 문자 깨짐 현상 수정**
  - `@echo off` 직후 `cls` 실행하여 초기 화면 정리
  - `chcp 65001 >nul 2>&1`로 stderr까지 리다이렉트
  - 코드페이지 전환 후 다시 `cls` 실행하여 깨진 문자 제거
  - 배치 파일 시작 시 깔끔한 화면 제공

### 📦 배포판 개선 (2025-10-15)
- **배치 파일 자동 생성**: `create-release.js`에서 언어별 배치 파일 생성
  - `run.bat`: `--lang=en` 자동 포함
  - `실행하기.bat`: `--lang=kr` 자동 포함
- **실행 파일 크기 최적화**: 압축으로 약 40% 크기 감소
- **네이티브 모듈 포함**: DB 연결 라이브러리 정상 작동 보장

## v1.2.5 - 배치 인터페이스 개선 (2025-10-10)

### 🔧 개선사항
- **📋 번호 선택 파일 선택**: 수동 경로 입력에서 번호 메뉴 시스템으로 파일 선택 방식 변경
- **✅ 향상된 입력 유효성 검증**: 파일 선택 번호에 대한 유효성 검증 추가
- **🎯 향상된 사용자 경험**: XML/JSON 파일의 자동 목록과 함께 더 직관적인 파일 선택
- **🔍 파일 유형 감지**: 선택 메뉴에서 XML 및 JSON 파일 자동 감지 및 분리
- **📁 빈 디렉토리 처리**: 쿼리 정의 파일이 없을 때 더 나은 처리

### 🪟 배치 인터페이스 변경사항
- **VALIDATE 메뉴**: 유효성 검사를 위한 모든 쿼리 파일(XML/JSON)의 번호 목록 표시
- **EXPORT_XML 메뉴**: 단순화된 선택이 가능한 XML 파일의 번호 목록 표시
- **EXPORT_JSON 메뉴**: 단순화된 선택이 가능한 JSON 파일의 번호 목록 표시
- **입력 유효성 검증**: 번호가 유효한 범위 내에 있는지 확인하고 명확한 오류 메시지 제공
- **사용자 피드백**: 처리하기 전에 선택한 파일 경로 표시

---

## v1.2.4 - 독립 실행 파일 및 향상된 사용자 경험 (2025-10-05)

### ✨ 새로운 기능
- **📦 독립 실행 파일 생성**: Node.js 의존성 없이 버전이 포함된 독립 실행 파일(.exe) 생성
- **🌐 다국어 릴리스 패키지**: 자동화된 한국어 및 영어 릴리스 패키지 생성
- **🕒 생성 타임스탬프 표시**: 각 엑셀 시트에 생성 타임스탬프 표시
- **⏰ 향상된 DateTime 변수**: 실시간 타임스탬프 생성을 위한 20개 이상의 자동 datetime 변수
- **📋 SQL 쿼리 포맷팅**: 목차에서 줄바꿈을 포함한 원본 SQL 포맷 유지
- **🔧 입력 유효성 검증**: 배치 인터페이스에서 파일 경로 입력에 대한 자동 공백 제거
- **🚀 릴리스 자동화**: 적절한 문서와 함께 완전한 자동화된 릴리스 프로세스

### 📦 독립 실행 파일 기능
- **버전이 포함된 실행 파일 이름**: 명확한 버전 식별을 위한 `sql2excel-v1.2.4.exe` 형식
- **에셋 번들링**: 실행 파일 내에 엑셀 템플릿 및 스타일 파일 번들
- **경로 해석**: 패키지 및 개발 환경에 대한 스마트 경로 해석
- **Node.js 의존성 없음**: 최종 사용자를 위한 완전한 자체 포함 실행 파일

### 🌐 다국어 지원
- **한국어 릴리스 패키지**: 한국어 문서 및 인터페이스가 포함된 `sql2excel-v1.2.4-ko`
- **영어 릴리스 패키지**: 영어 문서 및 인터페이스가 포함된 `sql2excel-v1.2.4-en`
- **로컬라이즈된 배치 파일**: 언어별 배치 인터페이스 (`sql2excel.bat`, `sql2excel-en.bat`)
- **자동화된 문서**: 사용자 매뉴얼 및 README 파일의 동적 버전 교체

### 🕒 향상된 DateTime 시스템
- **20개 이상의 DateTime 변수**: 다양한 형식을 위한 포괄적인 datetime 함수 세트
- **실시간 생성**: 각 함수는 실행 시 현재 타임스탬프 생성
- **다중 형식**: UTC, KST, 한국어 로컬라이즈, ISO, 압축 형식
- **변수 처리 순서**: datetime 변수가 올바르게 작동하도록 고정된 처리 순서

#### 사용 가능한 DateTime 변수
```javascript
CURRENT_TIMESTAMP    // 2025-10-05 14:30:25
KST_NOW             // 2025-10-05 23:30:25 (한국 표준시)
CURRENT_DATE        // 2025-10-05
CURRENT_TIME        // 14:30:25
KOREAN_DATE         // 2025년 10월 05일
KOREAN_DATETIME     // 2025년 10월 05일 14시 30분 25초
DATE_YYYYMMDD       // 20251005
DATETIME_YYYYMMDD_HHMMSS // 20251005_143025
ISO_TIMESTAMP       // 2025-10-05T14:30:25.123Z
UNIX_TIMESTAMP      // 1728134225
// ... 그리고 10개 이상의 형식
```

### 📋 목차 향상
- **SQL 포맷팅 보존**: 줄바꿈이 포함된 원본 SQL 쿼리 포맷 유지
- **생성 타임스탬프**: 각 시트에 파일 생성 타임스탬프 표시
- **향상된 가독성**: 복잡한 SQL 쿼리의 더 나은 시각적 표현

### 🔧 사용자 인터페이스 개선
- **입력 유효성 검증**: 배치 인터페이스에서 파일 경로에 대한 자동 공백 제거
- **오류 방지**: 우발적인 공백으로 인한 "파일을 찾을 수 없음" 오류 방지
- **복사-붙여넣기 친화적**: 앞뒤 공백이 있는 다른 소스에서 복사한 경로 처리

### 🚀 빌드 및 릴리스 시스템
- **자동화된 릴리스 스크립트**: `npm run release`로 완전한 릴리스 패키지 생성
- **버전 인식 빌드**: `npm run build`로 버전이 포함된 실행 파일 이름 생성
- **문서 동기화**: 모든 문서 파일의 자동 버전 교체
- **깨끗한 빌드 프로세스**: `npm run clean`으로 이전 빌드 및 릴리스 파일 제거

### 🔧 기술적 개선
- **모듈 해석 수정**: 패키지된 실행 파일에서 "모듈을 찾을 수 없음" 오류 해결
- **에셋 경로 관리**: 템플릿 및 스타일에 대한 동적 에셋 경로 해석
- **변수 처리 로직**: datetime 변수 치환 순서 수정
- **배치 스크립트 견고성**: 파일 유형 감지 및 오류 처리 개선

### 📚 문서 업데이트
- **사용자 매뉴얼 향상**: 모든 새로운 기능 및 독립 실행 파일 사용법으로 업데이트
- **릴리스 문서**: 포괄적인 배포 및 사용 지침
- **예제 업데이트**: datetime 변수 예제 및 다중 라인 SQL 포맷팅 추가

### 🐛 버그 수정
- **DateTime 변수 출력**: datetime 값이 엑셀 시트에 표시되지 않는 문제 수정
- **변수 처리 순서**: datetime 함수를 우선시하도록 변수 치환 순서 수정
- **XML 구조 유효성 검사**: 예제 파일에서 누락된 `<sheets>` 태그 수정
- **배치 파일 유형 감지**: Windows 배치 인터페이스에서 XML/JSON 파일 유형 식별 개선
- **경로 해석**: 패키지된 실행 파일 환경에서 템플릿 파일 경로 수정

---

## v1.2.3 - 파라미터 오버라이드 기능 추가 (2025-08-29)

### ✨ 새로운 기능
- **⚙️ 파라미터 오버라이드 기능**: 각 시트에 대해 쿼리 정의 파라미터 재정의
- **🔄 향상된 쿼리 재사용**: 동일한 쿼리 정의를 다른 파라미터와 함께 여러 시트에서 사용
- **📊 우선순위 시스템**: 순서대로 처리: 시트별 파라미터 > 전역 변수 > 기본값
- **🎯 다중 데이터 유형 지원**: 문자열, 숫자, 배열, 부울 및 날짜 파라미터 유형 지원
- **📝 상세 로깅**: 파라미터 오버라이드 프로세스에 대한 포괄적인 로깅 출력

### 📊 파라미터 오버라이드 시스템

#### XML에서 파라미터 오버라이드
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
</sheets>
```

#### JSON에서 파라미터 오버라이드
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
    }
  ]
}
```

### 🔧 개선사항
- **향상된 변수 처리 로직**: `substituteVars` 메서드에 시트별 파라미터 지원 추가
- **파서 개선**: XML 및 JSON 파서 모두에서 파라미터 오버라이드 기능 지원
- **유형 안전성**: 다양한 데이터 유형에 대한 안전한 파싱 및 처리
- **로깅 시스템**: 디버깅을 지원하기 위한 파라미터 오버라이드 프로세스의 상세 로깅 출력

### 📚 문서
- **사용자 매뉴얼 업데이트**: 파라미터 오버라이드 기능에 대한 상세 설명 추가
- **예제 파일 업데이트**: 파라미터 오버라이드 예제 추가
- **README 업데이트**: 주요 기능 목록에 파라미터 오버라이드 추가

---

## v1.2.2 - 동적 변수 시스템 향상 (2025-08-20)

### ✨ 새로운 기능
- **🔄 동적 변수 시스템**: 동적 쿼리 생성을 위해 실시간으로 데이터베이스에서 값 추출
- **📊 2가지 동적 변수 유형**: 기본 유형 (`column_identified` 동작), `key_value_pairs` 유형 지원
- **🎯 기본 유형 개선**: `type` 속성이 생략된 경우 자동으로 `column_identified` 유형으로 처리
- **🔗 시간 함수 통합**: 동적 변수에서 `CURRENT_TIMESTAMP`, `CURRENT_DATE`와 같은 시간 함수 사용
- **🌐 환경 변수 지원**: 동적 변수에서 환경 변수 사용
- **🐛 디버그 모드**: `DEBUG_VARIABLES=true` 환경 변수로 상세한 변수 치환 로깅

### 🔄 동적 변수 유형 기능

#### 1. 기본 유형 (column_identified 동작)
- `type` 속성이 생략된 경우 기본값
- 각 컬럼에 대한 배열 생성
- `${variableName.columnName}` 형식으로 특정 컬럼 값 액세스
- 예: `${customerData.CustomerID}`, `${customerData.Region}`

#### 2. key_value_pairs 유형
- 명시적인 `type="key_value_pairs"` 지정 필요
- 처음 두 컬럼에서 키-값 쌍 생성
- `${variableName.keyName}` 형식으로 키 값 액세스
- 예: `${productPrices.ProductID}`

### 📝 사용 예제
```xml
<!-- 동적 변수 정의 -->
<dynamicVars>
  <!-- 기본 유형: type 속성 생략 -->
  <dynamicVar name="customerData" description="컬럼별 고객 데이터">
    <![CDATA[
      SELECT CustomerID, CustomerName, City, Region
      FROM Customers WHERE IsActive = 1
    ]]>
  </dynamicVar>
  
  <!-- key_value_pairs 유형: 명시적 지정 -->
  <dynamicVar name="productPrices" type="key_value_pairs" description="제품 가격 정보">
    <![CDATA[
      SELECT ProductID, UnitPrice
      FROM Products WHERE Discontinued = 0
    ]]>
  </dynamicVar>
</dynamicVars>

<!-- 동적 변수 사용 -->
<sheet name="CustomerOrderAnalysis">
  <![CDATA[
    SELECT * FROM Orders 
    WHERE CustomerID IN (${customerData.CustomerID})
      AND Region IN (${customerData.Region})
      AND ProductID IN (${productPrices.ProductID})
  ]]>
</sheet>
```

### 🔧 개선사항
- **기본 유형 단순화**: `type` 속성이 생략된 경우 자동으로 `column_identified` 유형으로 처리하여 사용성 개선
- **변수 치환 우선순위**: 순서대로 처리: 동적 변수 > 일반 변수 > 시간 함수 > 환경 변수
- **SQL 인젝션 방지**: 모든 변수 값에 대한 적절한 이스케이프 처리
- **향상된 오류 처리**: 처리 오류가 발생할 때 안전을 위해 동적 변수를 빈 배열로 대체
- **성능 최적화**: 동적 변수는 한 번 실행되고 전체 내보내기에 대해 캐시됨

### 📚 문서
- **README.md 업데이트**: 동적 변수 기능 소개 및 예제 추가
- **USER_MANUAL.md 확장**: 동적 변수 사용법 및 유형 설명 상세 추가
- **예제 파일 추가**: `queries-with-dynamic-variables.xml`, `queries-with-dynamic-variables.json` 생성

---

## v1.2.1 - 문서 개선 (2025-08-11)

### 📚 문서
- **📖 사용자 매뉴얼**: 포괄적인 `USER_MANUAL.md` 추가
- **📋 버전 히스토리**: 체계적인 `CHANGELOG.md` 추가
- **🔧 구성 가이드**: 데이터베이스 연결 및 설정에 대한 상세 지침
- **💡 예제 확장**: 다양한 사용 시나리오 및 예제 코드 추가

### 🔧 개선사항
- **문서 구조**: 목차가 있는 체계적인 문서 구성
- **예제 향상**: 실제 사용 시나리오에 대한 상세 예제
- **문제 해결 가이드**: 일반적인 문제 및 해결 방법
- **버전 히스토리**: 모든 버전 변경사항의 체계적 정리

---

## v1.2.0 - 쿼리 재사용 및 CLI 개선 (2024-08-07)

### ✨ 새로운 기능
- **🔄 쿼리 정의 재사용**: `queryDefs`로 공통 쿼리를 정의하고 여러 시트에서 재사용
- **🖥️ 새로운 CLI 인터페이스**: `excel-cli.js`를 통한 명령줄 도구
- **🪟 Windows 배치 파일**: Windows 사용자를 위한 편리한 실행 배치 파일
- **✅ 파일 유효성 검사**: 쿼리 파일 형식 및 구조 유효성 검사 도구
- **🔗 DB 연결 테스트**: 구성된 모든 데이터베이스의 연결 상태 확인

### 📊 쿼리 재사용 시스템
- **XML/JSON 지원**: 두 형식 모두에서 `queryDefs` 기능 지원
- **코드 재사용**: `queryRef`를 사용하여 여러 시트에서 동일한 쿼리 참조
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
  
  <sheet name="CustomerOrders" use="true">
    <![CDATA[
      SELECT o.*, c.CustomerName
      FROM Orders o
      INNER JOIN (${customer_base}) c ON o.CustomerID = c.CustomerID
    ]]>
  </sheet>
</sheets>
```

### 🖥️ CLI 명령
```bash
# 엑셀 파일 생성
node src/excel-cli.js export --xml ./queries/sample.xml

# 쿼리 파일 유효성 검사
node src/excel-cli.js validate --xml ./queries/sample.xml

# 데이터베이스 목록
node src/excel-cli.js list-dbs

# 도움말
node src/excel-cli.js help
```

### 🪟 Windows 배치 파일
- `실행하기.bat`: 대화형 실행
- `export-xml.bat`: 직접 XML 내보내기
- `export-json.bat`: 직접 JSON 내보내기
- `validate.bat`: 파일 유효성 검사
- `db-test.bat`: 데이터베이스 연결 테스트

---

## v1.1.5 - 엑셀 스타일링 향상 (2024-08-06)

### ✨ 새로운 기능
- **🎨 고급 엑셀 스타일링**: 헤더 및 데이터 영역에 대한 포괄적인 스타일링
- **📊 글꼴 제어**: 글꼴 이름, 크기, 색상, 굵게, 기울임꼴 설정
- **🎨 채우기 제어**: 배경색 및 패턴 설정
- **📏 테두리 제어**: 테두리 스타일, 색상 및 위치 설정
- **📐 정렬 제어**: 가로/세로 정렬 및 텍스트 줄바꿈

### 📝 스타일링 예제
```xml
<excel db="sampleDB" output="output/StyledReport.xlsx">
  <header>
    <font name="Arial" size="12" color="FFFFFF" bold="true"/>
    <fill color="4F81BD" patternType="solid"/>
    <border>
      <top style="thin" color="000000"/>
      <bottom style="thin" color="000000"/>
    </border>
    <alignment horizontal="center" vertical="center"/>
  </header>
  
  <data>
    <font name="Arial" size="10"/>
    <border>
      <top style="thin" color="CCCCCC"/>
      <bottom style="thin" color="CCCCCC"/>
    </border>
  </data>
</excel>
```

---

## v1.1.4 - 집계 및 목차 (2024-08-05)

### ✨ 새로운 기능
- **📊 집계 기능**: 지정된 컬럼 값별 개수 자동 집계 및 표시
- **📋 자동 목차**: 하이퍼링크가 있는 목차 시트 자동 생성
- **🔗 하이퍼링크 지원**: 시트 간 클릭 가능한 링크
- **📈 통계 표시**: 행 개수 및 생성 정보

### 📝 집계 예제
```xml
<sheet name="SalesByRegion" use="true" aggregateColumn="Region">
  <![CDATA[
    SELECT Region, SUM(TotalAmount) as TotalSales, COUNT(*) as OrderCount
    FROM Orders o
    INNER JOIN Customers c ON o.CustomerID = c.CustomerID
    GROUP BY Region
  ]]>
</sheet>
```

### 📋 목차 기능
- 하이퍼링크로 시트 이름
- 각 시트의 행 개수
- 생성 타임스탬프
- 파일 정보

---

## v1.1.3 - 다중 데이터베이스 지원 (2024-08-04)

### ✨ 새로운 기능
- **🔗 다중 DB 연결**: 각 시트마다 다른 데이터베이스 연결 사용
- **📊 데이터베이스 선택**: 시트별 데이터베이스 지정
- **🔧 연결 관리**: 효율적인 연결 풀 관리
- **📋 연결 유효성 검사**: 모든 데이터베이스 연결 유효성 검사

### 📝 다중 DB 예제
```xml
<excel db="defaultDB" output="output/MultiDBReport.xlsx">
  <!-- 기본 데이터베이스 설정 -->
</excel>

<sheets>
  <sheet name="CustomerData" db="customerDB" use="true">
    <![CDATA[SELECT * FROM Customers]]>
  </sheet>
  
  <sheet name="OrderData" db="orderDB" use="true">
    <![CDATA[SELECT * FROM Orders]]>
  </sheet>
</sheets>
```

---

## v1.1.2 - 변수 시스템 향상 (2024-08-03)

### ✨ 새로운 기능
- **📝 향상된 변수 시스템**: 개선된 변수 치환 및 유효성 검사
- **🔗 시간 함수**: `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `CURRENT_TIME` 지원
- **🌐 환경 변수**: 시스템 환경 변수 사용
- **✅ 변수 유효성 검사**: 변수 정의 및 사용 유효성 검사

### 📝 변수 예제
```xml
<vars>
  <var name="startDate">2024-01-01</var>
  <var name="endDate">2024-12-31</var>
  <var name="currentTime">${CURRENT_TIMESTAMP}</var>
  <var name="dbName">${DATABASE_NAME}</var>
</vars>

<sheet name="TimeBasedReport" use="true">
  <![CDATA[
    SELECT * FROM Orders 
    WHERE OrderDate BETWEEN '${startDate}' AND '${endDate}'
      AND CreatedAt <= '${currentTime}'
  ]]>
</sheet>
```

---

## v1.1.1 - 성능 및 안정성 (2024-08-02)

### ✨ 새로운 기능
- **🚦 쿼리 제한**: 대용량 데이터 처리를 위한 행 개수 제한
- **📊 메모리 최적화**: 대용량 데이터셋에 대한 메모리 사용 개선
- **🔧 오류 처리**: 향상된 오류 처리 및 복구
- **📋 진행 상황 보고**: 긴 작업에 대한 실시간 진행 상황 보고

### 🔧 개선사항
- **성능**: 대용량 결과 세트에 대한 최적화된 데이터 처리
- **안정성**: 개선된 오류 처리 및 복구 메커니즘
- **메모리**: 대용량 내보내기를 위한 더 나은 메모리 관리
- **로깅**: 향상된 로깅 및 진행 상황 보고

---

## v1.1.0 - 다중 시트 지원 (2024-08-01)

### ✨ 새로운 기능
- **📊 다중 시트 지원**: 하나의 엑셀 파일 내 별도 시트에 여러 SQL 쿼리 결과 저장
- **📋 시트 관리**: 개별 시트 구성 및 제어
- **🎨 시트 스타일링**: 시트별 개별 스타일링
- **📊 데이터 구성**: 여러 시트에 걸친 체계적인 데이터 표현

### 📝 다중 시트 예제
```xml
<sheets>
  <sheet name="CustomerList" use="true">
    <![CDATA[SELECT * FROM Customers]]>
  </sheet>
  
  <sheet name="OrderSummary" use="true">
    <![CDATA[
      SELECT CustomerID, COUNT(*) as OrderCount, SUM(TotalAmount) as TotalSales
      FROM Orders GROUP BY CustomerID
    ]]>
  </sheet>
  
  <sheet name="ProductCatalog" use="true">
    <![CDATA[SELECT * FROM Products WHERE Discontinued = 0]]>
  </sheet>
</sheets>
```

---

## v1.0.5 - 구성 향상 (2024-07-31)

### ✨ 새로운 기능
- **📄 JSON 지원**: 전체 JSON 구성 파일 지원
- **🔧 구성 유효성 검사**: 포괄적인 구성 유효성 검사
- **📋 기본값**: 모든 설정에 대한 합리적인 기본값
- **🔍 오류 보고**: 상세한 오류 보고 및 제안

### 📝 JSON 구성 예제
```json
{
  "excel": {
    "db": "sampleDB",
    "output": "output/Report.xlsx"
  },
  "sheets": [
    {
      "name": "CustomerData",
      "use": true,
      "query": "SELECT * FROM Customers"
    }
  ]
}
```

---

## v1.0.4 - 데이터베이스 연결 (2024-07-30)

### ✨ 새로운 기능
- **🔗 SQL Server 지원**: 전체 SQL Server 데이터베이스 연결
- **🔧 연결 구성**: 유연한 데이터베이스 연결 구성
- **📋 연결 풀링**: 효율적인 연결 풀 관리
- **🔍 연결 유효성 검사**: 데이터베이스 연결 유효성 검사 및 테스트

### 📝 데이터베이스 구성
```json
{
  "dbs": {
    "sampleDB": {
      "server": "localhost",
      "port": 1433,
      "database": "SampleDB",
      "user": "sa",
      "password": "password",
      "options": {
        "encrypt": false,
        "trustServerCertificate": true
      }
    }
  }
}
```

---

## v1.0.3 - 핵심 엑셀 생성 (2024-07-29)

### ✨ 새로운 기능
- **📊 엑셀 파일 생성**: 핵심 엑셀 파일 생성 기능
- **📋 데이터 내보내기**: SQL 쿼리 결과를 엑셀 형식으로
- **🎨 기본 스타일링**: 기본 엑셀 스타일링 및 포맷팅
- **📄 다중 형식**: .xlsx 형식 지원

### 🔧 핵심 기능
- SQL 쿼리 실행
- 데이터 추출 및 포맷팅
- 엑셀 파일 생성
- 기본 스타일링 적용

---

## v1.0.2 - 프로젝트 기반 (2024-07-28)

### ✨ 새로운 기능
- **🏗️ 프로젝트 구조**: 초기 프로젝트 구조 및 구성
- **📦 의존성**: 핵심 Node.js 의존성 및 패키지
- **🔧 구성**: 기본 구성 시스템
- **📚 문서**: 초기 프로젝트 문서

### 📋 기반
- Node.js 프로젝트 설정
- Package.json 구성
- 기본 파일 구조
- 초기 문서

---

## v1.0.1 - 초기 릴리스 (2024-07-27)

### ✨ 새로운 기능
- **🎯 핵심 기능**: 기본 SQL에서 엑셀 변환 기능
- **🔗 데이터베이스 지원**: SQL Server 데이터베이스 연결
- **📊 데이터 내보내기**: SQL 쿼리 결과를 엑셀로 내보내기
- **🖥️ 명령줄**: 기본 명령줄 인터페이스

### 📋 초기 기능
- 기본 SQL 쿼리 실행
- 엑셀 파일 생성
- 간단한 데이터 내보내기
- 명령줄 인터페이스

---

**연락처**: sql2excel.nodejs@gmail.com  
**웹사이트**: sql2excel.com  
**라이센스**: MIT License

