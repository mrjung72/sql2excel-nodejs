# sql2excel-nodejs 사용 매뉴얼

## 개요
- 다양한 SQL 쿼리 결과를 여러 시트로 엑셀 파일로 저장하는 Node.js CLI 도구
- 멀티 DB 지원, 쿼리/엑셀/시트별 다양한 옵션 지원
- XML/JSON 쿼리 정의 파일 지원

---

## 1. 설치 및 준비

1. Node.js 16+ 설치
2. 의존성 설치
   ```bash
   npm install
   ```
3. DB 접속정보 설정: `resources/config.json` 참고

---

## 2. 쿼리 정의 파일 구조

### XML 예시 (`resources/queries-sample.xml`)
```xml
<queries>
  <excel db="main" output="output/매출집계_2024.xlsx">
    <header>
      <font name="맑은 고딕" size="12" color="FFFFFF" bold="true"/>
      <fill color="4F81BD"/>
      <colwidths min="10" max="30"/>
    </header>
    <body>
      <font name="맑은 고딕" size="11" color="000000" bold="false"/>
      <fill color="FFFFCC"/>
    </body>
  </excel>
  <vars>
    <var name="startDate">2024-01-01</var>
    <var name="endDate">2024-06-30</var>
    <var name="regionList">'서울','부산'</var>
  </vars>
  <sheet name="Orders" use="true" aggregateColumn="OrderStatus" maxRows="1000">
    <![CDATA[
      SELECT * FROM Orders
      WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'
    ]]>
  </sheet>
  <sheet name="Customers" use="false" aggregateColumn="Region" maxRows="500">
    <![CDATA[
      SELECT * FROM Customers
      WHERE region IN (${regionList})
    ]]>
  </sheet>
</queries>
```

### JSON 예시 (`resources/queries-sample.json`)
```json
{
  "excel": {
    "db": "main",
    "output": "output/매출집계_2024.xlsx",
    "header": {
      "font": { "name": "맑은 고딕", "size": 12, "color": "FFFFFF", "bold": true },
      "fill": { "color": "4F81BD" },
      "colwidths": { "min": 10, "max": 30 }
    },
    "body": {
      "font": { "name": "맑은 고딕", "size": 11, "color": "000000", "bold": false },
      "fill": { "color": "FFFFCC" }
    }
  },
  "vars": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "regionList": "'서울','부산'"
  },
  "sheets": [
    {
      "name": "Orders",
      "use": true,
      "aggregateColumn": "OrderStatus",
      "maxRows": 1000,
      "query": "SELECT * FROM Orders WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'"
    },
    {
      "name": "Customers",
      "use": false,
      "aggregateColumn": "Region",
      "maxRows": 500,
      "query": "SELECT * FROM Customers WHERE region IN (${regionList})"
    }
  ]
}
```

---

## 3. 실행 방법

### 기본 실행
```bash
node src/index.js -x resources/queries-sample.xml
```
또는
```bash
node src/index.js -q resources/queries-sample.json
```

### 주요 옵션
- `-x`, `--xml` : XML 쿼리 정의 파일 경로
- `-q`, `--query` : JSON 쿼리 정의 파일 경로
- `-c`, `--config` : DB 접속정보 파일 경로(기본값: resources/config.json)
- `--db` : 사용할 DB ID (config.json의 dbs 키)
- `-o`, `--out` : 엑셀 파일명(경로)
- `-v`, `--var` : 쿼리 변수 (key=value, 여러 개 가능)

### 예시
```bash
node src/index.js -x resources/queries-sample.xml -v startDate=2024-01-01 -v endDate=2024-06-30
node src/index.js -q resources/queries-sample.json --db main --out output/result.xlsx
```

---

## 4. 주요 기능

- 여러 DB 접속정보 지원 (config.json)
- 쿼리파일에서 DB, 엑셀경로, 스타일(폰트, bold, 배경색, 컬럼너비 min/max) 한 번에 지정
- 시트별 사용여부(use) 지정 가능
- 전역 변수/CLI 변수 지원 (중복시 CLI 우선)
- 엑셀 파일명에 자동으로 실행시각(yyyymmddhhmmss) 추가
- 컬럼별 데이터 길이에 따라 자동 너비(최소/최대값 내)
- 헤더/데이터 각각 스타일 적용
- 실행 시 XML 쿼리파일 목록 자동 안내
- 결과 엑셀 파일 경로의 폴더가 없으면 자동 생성
- **자동 목차 시트 생성** (하이퍼링크 포함)
- **컬럼별 집계 데이터 표시** (목차 시트에서 한눈에 확인)
- **조회 건수 제한 기능** (대용량 데이터 처리 시 안전장치)

---

## 7. 엑셀 스타일/속성 설정 가이드

### 엑셀 전체 스타일(excel)
| 속성명      | 위치         | 설명                                      | 예시값           |
|-------------|--------------|--------------------------------------------|------------------|
| db          | excel        | 사용할 DB 접속 ID (config.json의 dbs 키)   | "main"          |
| output      | excel        | 생성할 엑셀 파일 경로/이름                 | "output/result.xlsx" |
| header      | excel        | 헤더(타이틀) 스타일                       | 객체             |
| body        | excel        | 데이터(본문) 스타일                       | 객체             |

### header/body 스타일 속성
| 속성명      | 위치         | 설명                                      | 예시값           |
|-------------|--------------|--------------------------------------------|------------------|
| font        | header/body  | 폰트 스타일 (name, size, color, bold)      | {"name":"맑은 고딕", "size":12, "color":"FFFFFF", "bold":true} |
| fill        | header/body  | 배경색 (color: 16진 ARGB)                  | {"color":"4F81BD"} |
| colwidths   | header       | 컬럼너비 자동계산 범위 (min/max)           | {"min":10, "max":30} |
| alignment   | header/body  | 셀 정렬 (horizontal, vertical)             | {"horizontal":"center", "vertical":"middle"} |
| border      | header/body  | 테두리 스타일 (all/top/left/right/bottom)  | {"all":{"style":"thin","color":"000000"}} |

#### font 속성 상세
| 하위속성 | 설명           | 예시값         |
|----------|----------------|---------------|
| name     | 폰트명         | "맑은 고딕"   |
| size     | 폰트 크기      | 12            |
| color    | 폰트 색상(ARGB)| "FFFFFF"      |
| bold     | 굵게           | true/false    |

#### fill 속성 상세
| 하위속성 | 설명           | 예시값         |
|----------|----------------|---------------|
| color    | 배경색(ARGB)   | "FFFFCC"      |

#### colwidths 속성 상세
| 하위속성 | 설명           | 예시값         |
|----------|----------------|---------------|
| min      | 최소 너비      | 10            |
| max      | 최대 너비      | 30            |

#### alignment 속성 상세
| 하위속성   | 설명           | 예시값         |
|------------|----------------|---------------|
| horizontal | 가로 정렬      | "center", "left", "right" |
| vertical   | 세로 정렬      | "top", "middle", "bottom" |

#### border 속성 상세
| 하위속성   | 설명           | 예시값         |
|------------|----------------|---------------|
| all        | 4방향 모두     | {"style":"thin","color":"000000"} |
| top/left/right/bottom | 각 방향별 | {"style":"thin","color":"000000"} |

### 시트 속성
| 속성명 | 위치   | 설명                | 예시값 |
|--------|--------|---------------------|--------|
| name   | sheet  | 시트명(변수 사용 가능)| "매출_${startDate}_~_${endDate}" |
| use    | sheet  | 사용여부            | true/false |
| aggregateColumn | sheet | 집계할 컬럼명 (목차 시트에 표시) | "주문상태", "지역" |
| maxRows | sheet | 최대 조회 건수 제한 | 1000, 5000 |

---

## 5. 목차 시트 및 집계 기능

### 자동 목차 시트
- 모든 엑셀 파일에 자동으로 **'목차'** 시트가 첫 번째 시트로 생성됩니다
- 목차 시트는 파란색 탭으로 구분되며, 다음 정보를 포함합니다:

| 컬럼 | 설명 | 하이퍼링크 |
|------|------|------------|
| No | 시트 순번 | ❌ |
| Sheet Name | 실제 시트명 (변수 치환됨) | ✅ 클릭 시 해당 시트로 이동 |
| Records | 데이터 건수 (천 단위 구분자) | ✅ 클릭 시 해당 시트로 이동 |
| Aggregate Info | 집계 정보 | ✅ 클릭 시 해당 시트로 이동 |
| Note | 비고 (시트명 잘림 등) | ❌ |

### 컬럼별 집계 기능
각 시트에서 특정 컬럼의 값별 건수를 자동으로 집계하여 목차에 표시합니다.

#### XML에서 집계 컬럼 및 조회 제한 지정
```xml
<sheet name="주문_목록" use="true" aggregateColumn="주문상태" maxRows="1000">
  <![CDATA[
    SELECT OrderID, OrderStatus, CustomerName, OrderDate 
    FROM Orders 
    WHERE OrderDate >= '${startDate}'
  ]]>
</sheet>
```

#### JSON에서 집계 컬럼 및 조회 제한 지정
```json
{
  "name": "주문_목록",
  "use": true,
  "aggregateColumn": "주문상태",
  "maxRows": 1000,
  "query": "SELECT OrderID, OrderStatus, CustomerName, OrderDate FROM Orders WHERE OrderDate >= '${startDate}'"
}
```

#### 집계 결과 표시 예시
```
[주문상태] Shipped:15, Processing:8, Cancelled:3 외 2개
[지역] 서울:25, 부산:12, 대구:8
[카테고리] 전자제품:45, 의류:32, 도서:18 외 5개
```

### 조회 건수 제한 기능 (maxRows)
대용량 데이터 처리 시 시스템 부하를 줄이고 안전하게 작업할 수 있도록 조회 건수를 제한합니다.

#### 작동 원리
- SQL 쿼리에 `TOP N` 절을 자동으로 추가하여 조회 건수를 제한
- 쿼리에 이미 `TOP` 절이 있는 경우 maxRows 설정을 무시하고 경고 메시지 출력
- 제한이 적용되면 콘솔에 `[제한] 최대 N건으로 제한됨` 메시지 표시

#### 사용 예시
```xml
<!-- 최대 5000건까지만 조회 -->
<sheet name="대용량_주문데이터" maxRows="5000">
  <![CDATA[
    SELECT * FROM Orders WHERE OrderDate >= '2024-01-01'
  ]]>
</sheet>
```

#### 주의사항
- **제한 없음**: maxRows 미설정 또는 0 이하의 값
- **기존 TOP 절**: 쿼리에 이미 TOP이 있으면 maxRows 무시됨
- **대용량 처리**: 수십만 건 이상의 데이터는 적절한 제한 권장

### 목차 시트 특징
- **하이퍼링크**: 시트명, 데이터 건수, 집계 정보 클릭 시 해당 시트로 즉시 이동
- **시트명 자동 처리**: 31자 초과 시 자동 잘림 및 원본명 주석 표시
- **집계 정보**: 상위 3개 항목 표시, 나머지는 "외 N개"로 요약
- **정렬**: 집계 항목은 건수가 많은 순으로 정렬
- **스타일**: 파란색 링크, 천 단위 구분자, 적절한 컬럼 너비 자동 설정

---

## 6. 기타 참고
- 쿼리문 내 `${변수명}` 형태로 변수 사용 가능
- 시트별로 `use="false"` 또는 `"use": false`로 비활성화 가능
- 쿼리파일 구조/옵션은 필요에 따라 확장 가능

---

## 7. 모듈 구조

### 핵심 파일 구조
```
src/
├── index.js                  # 메인 실행 파일
├── excel-style-helper.js     # 엑셀 스타일 관련 유틸리티
test/
├── test-exceljs-style.js     # ExcelJS 기본 테스트
└── test-excel-style-helper.js # 스타일 헬퍼 모듈 테스트
```

### 스타일 헬퍼 모듈 (`excel-style-helper.js`)

엑셀 셀 속성 관련 로직을 별도로 분리한 유틸리티 모듈입니다.

#### 주요 함수

| 함수명 | 설명 | 용도 |
|--------|------|------|
| `parseBorder(border)` | 테두리 객체를 ExcelJS 형식으로 변환 | 테두리 스타일 적용 |
| `parseFont(fontStyle)` | 폰트 객체를 ExcelJS 형식으로 변환 | 폰트 스타일 적용 |
| `parseFill(fillStyle)` | 채우기 객체를 ExcelJS 형식으로 변환 | 배경색 적용 |
| `parseAlignment(alignmentStyle)` | 정렬 객체를 ExcelJS 형식으로 변환 | 텍스트 정렬 적용 |
| `applyCellStyle(cell, style)` | 단일 셀에 종합 스타일 적용 | 개별 셀 스타일링 |
| `applyHeaderStyle(sheet, columns, headerStyle)` | 헤더 행에 스타일 적용 | 헤더 스타일링 |
| `applyBodyStyle(sheet, columns, dataRowCount, bodyStyle)` | 데이터 행들에 스타일 적용 | 데이터 스타일링 |
| `calculateColumnWidths(columns, data, colwidths)` | 컬럼 너비 자동 계산 | 자동 너비 조정 |
| `applySheetStyle(sheet, data, excelStyle)` | 시트 전체에 데이터와 스타일 적용 | 통합 시트 처리 |
| `createTableOfContents(workbook, sheetNames)` | 새로운 목차 시트 생성 | 별도 파일용 목차 생성 |
| `populateTableOfContents(tocSheet, sheetNames)` | 기존 목차 시트에 내용 채우기 | 메인 파일 목차 업데이트 |

#### 사용 예시
```javascript
const excelStyleHelper = require('./excel-style-helper');

// 시트에 데이터와 스타일을 한 번에 적용
excelStyleHelper.applySheetStyle(sheet, data, {
  header: { font: { bold: true }, fill: { color: '4F81BD' } },
  body: { font: { size: 11 }, fill: { color: 'FFFFCC' } }
});

// 기존 목차 시트에 내용 채우기 (집계 정보 및 하이퍼링크 포함)
const sheetInfo = [
  { 
    displayName: '주문_목록', 
    tabName: '주문_목록', 
    recordCount: 150,
    aggregateColumn: '주문상태',
    aggregateData: [
      { key: 'Shipped', count: 89 },
      { key: 'Processing', count: 45 },
      { key: 'Cancelled', count: 16 }
    ]
  }
];
excelStyleHelper.populateTableOfContents(tocSheet, sheetInfo);
```

### 테스트 실행
```bash
# 스타일 헬퍼 모듈 테스트
node test/test-excel-style-helper.js

# ExcelJS 기본 테스트
node test/test-exceljs-style.js
```

### 샘플 데이터베이스 설정

프로젝트에는 테스트용 샘플 데이터베이스 스크립트가 포함되어 있습니다.

#### 1단계: 테이블 생성
```sql
-- SQL Server Management Studio에서 실행
-- 파일: resources/create_sample_tables.sql
-- 생성되는 테이블: Customers, Orders, OrderDetails + vw_OrderSummary 뷰
```

#### 2단계: 샘플 데이터 입력
```sql
-- 파일: resources/insert_sample_data.sql
-- 입력되는 데이터:
-- - 고객 13개 (국내 + 해외)
-- - 주문 13개 (완료/처리중/취소)
-- - 주문상세 18개
```

#### 3단계: 샘플 쿼리 실행
```bash
# JSON 설정파일 - 주문관리 보고서 생성 (10개 시트)
node src/index.js -q resources/queries-sample-orders.json
# 또는
test-sample-orders.bat

# XML 설정파일 - 매출집계 보고서 생성 (3개 시트)
node src/index.js -x resources/queries-sample.xml
# 또는
test-sample-xml.bat
```

#### JSON vs XML 설정파일 비교
| 항목 | JSON | XML |
|------|------|-----|
| 설정 방식 | 객체 기반 | 태그 기반 |
| 스타일 지원 | ✅ 완전 지원 | ✅ 완전 지원 |
| 테두리 설정 | `"border": {"all": {"style": "thin"}}` | `<border><all style="thin"/></border>` |
| 정렬 설정 | `"alignment": {"horizontal": "center"}` | `<alignment horizontal="center"/>` |
| 폰트 설정 | `"font": {"bold": true}` | `<font bold="true"/>` |
| 중첩 구조 | 직관적 | 더 구조적 |

#### 스타일 적용 확인
XML과 JSON 모두 다음 스타일이 동일하게 적용됩니다:
- **헤더**: 중앙정렬, 파란배경, 흰글자, 검은테두리, 굵은글씨
- **데이터**: 좌측정렬, 노란배경, 검은글자, 회색테두리, 일반글씨
- **컬럼너비**: 자동조정 (최소 10, 최대 30)

#### 포함된 샘플 데이터
- **고객**: 삼성전자, LG전자, 현대자동차, 신세계백화점, 부산항만공사, 롯데백화점, 대구은행, 인천공항, 기아자동차, KAIST, Sony, Apple 등
- **주문**: 2024년 1월~4월 주문 데이터 (배송완료/처리중/취소 상태 포함)
- **상품**: 갤럭시 S24, LG OLED TV, 현대차 부품, 명품 핸드백, 항만시스템, 보안솔루션 등

---

## 7. 배포

### 배포본 생성
```bash
# 자동 배포본 생성 스크립트 실행
build-release.bat
```

### 배포본 구조
- 실행 파일들 (*.bat)
- 소스 코드 (src/)
- 설정 파일들 (resources/)
- 자동 설치 스크립트 (install.bat)
- 사용자 가이드 (QUICK_START.md)
- 버전 정보 (VERSION.txt)

---

## 8. 문의/기여
- 개선 요청, 버그 제보, 추가 기능 문의는 언제든 환영합니다!
