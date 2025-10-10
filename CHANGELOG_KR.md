# SQL2Excel 버전 히스토리

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

