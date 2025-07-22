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
  <sheet name="Orders" use="true">
    <![CDATA[
      SELECT * FROM Orders
      WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'
    ]]>
  </sheet>
  <sheet name="Customers" use="false">
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
      "query": "SELECT * FROM Orders WHERE OrderDate >= '${startDate}' AND OrderDate <= '${endDate}'"
    },
    {
      "name": "Customers",
      "use": false,
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

---

## 5. 기타 참고
- 쿼리문 내 `${변수명}` 형태로 변수 사용 가능
- 시트별로 `use="false"` 또는 `"use": false`로 비활성화 가능
- 쿼리파일 구조/옵션은 필요에 따라 확장 가능

---

## 6. 모듈 구조

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
| `createTableOfContents(workbook, sheetNames)` | 목차 시트 생성 | 목차 생성 |

#### 사용 예시
```javascript
const excelStyleHelper = require('./excel-style-helper');

// 시트에 데이터와 스타일을 한 번에 적용
excelStyleHelper.applySheetStyle(sheet, data, {
  header: { font: { bold: true }, fill: { color: '4F81BD' } },
  body: { font: { size: 11 }, fill: { color: 'FFFFCC' } }
});

// 목차 시트 생성
const tocSheet = excelStyleHelper.createTableOfContents(workbook, sheetNames);
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
# 주문관리 보고서 생성 (10개 시트)
node src/index.js -q resources/queries-sample-orders.json

# 생성되는 시트:
# - 전체_고객_목록, 활성_고객_목록, 주요지역_고객
# - 전체_주문_목록, 기간별_주문, 처리중_주문, 주문_상세_내역
# - 고객별_주문_집계, 월별_매출_집계, 지역별_매출_분석
```

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
