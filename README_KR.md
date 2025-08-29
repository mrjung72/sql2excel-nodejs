# SQL2Excel - SQL 쿼리 결과를 엑셀 파일로 생성

SQL 쿼리 결과를 엑셀 파일로 생성하는 Node.js 기반 도구입니다.

## 🎯 주요 기능

- 📊 **멀티 시트 지원**: 여러 SQL 쿼리 결과를 하나의 엑셀 파일에 시트별로 저장
- 🎨 **엑셀 스타일링**: 헤더/데이터 영역 각각 폰트, 색상, 테두리, 정렬 등 세부 스타일 설정
- 🔗 **다중 DB 연결**: 시트별로 다른 데이터베이스 연결 가능
- 📝 **변수 시스템**: 쿼리 내 변수 사용으로 동적 쿼리 생성
- 🔄 **동적 변수**: 데이터베이스에서 실시간으로 값을 조회하여 동적 쿼리 생성
- 🔄 **쿼리 재사용**: 공통 쿼리 정의 후 여러 시트에서 재사용
- ⚙️ **파라미터 재설정**: 시트별로 쿼리 정의의 파라미터 값을 재설정
- 📋 **자동 목차**: 목차 시트 자동 생성 및 하이퍼링크 제공
- 📊 **집계 기능**: 지정 컬럼의 값별 건수 자동 집계 및 표시
- 🚦 **조회 제한**: 대용량 데이터 처리를 위한 건수 제한 기능
- 🖥️ **CLI 인터페이스**: 명령줄 도구로 간편한 실행
- 🪟 **윈도우 배치 파일**: 윈도우 사용자를 위한 배치 파일 제공
- 📄 **XML/JSON 지원**: 유연한 설정 파일 형식 지원

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 데이터베이스 설정
`config/dbinfo.json` 파일에 데이터베이스 연결 정보 설정:
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
    }
  }
}
```

### 3. 엑셀 파일 생성
```bash
# CLI 명령어로 실행
node src/excel-cli.js export --xml ./queries/queries-sample.xml

# 또는 NPM 스크립트로 실행
npm run export -- --xml ./queries/queries-sample.xml

# 또는 윈도우 배치 파일로 실행
실행하기.bat
```

### 4. 주요 CLI 명령어
```bash
# 엑셀 파일 생성
node src/excel-cli.js export --xml ./queries/sample.xml

# 쿼리 파일 검증
node src/excel-cli.js validate --xml ./queries/sample.xml

# 데이터베이스 연결 테스트
node src/excel-cli.js list-dbs

# 도움말
node src/excel-cli.js help
```

## 📚 문서

상세한 사용법과 고급 기능은 다음 문서를 참조하세요:

- **📖 [사용자 매뉴얼](USER_MANUAL.md)** - 완전한 사용 가이드
- **📋 [버전 히스토리](CHANGELOG.md)** - 버전별 변경사항

## 💡 사용 예시

### XML 설정 파일 예시 (동적 변수 포함)
```xml
<queries>
  <excel db="sampleDB" output="output/매출보고서.xlsx">
    <header>
      <font name="맑은 고딕" size="12" color="FFFFFF" bold="true"/>
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
  
  <sheet name="월별매출" use="true" aggregateColumn="Month">
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

### 변수 사용 예시
```bash
node src/excel-cli.js export --xml ./queries/sales-report.xml \
  --var "startDate=2024-01-01" \
  --var "endDate=2024-06-30"
```

## 🔧 환경 요구사항

- Node.js 16.0 이상
- SQL Server 2012 이상
- 적절한 데이터베이스 권한

## 📞 지원

- **웹사이트**: sql2excel.com
- **이메일**: sql2excel.nodejs@gmail.com

---

**버전**: v1.2.2 | **최종 업데이트**: 2025-08-20
