# SQL2Excel 버전 히스토리

## v1.2.1 - 문서화 개선 (2025-08-11)

### 📚 문서화
- **📖 사용자 매뉴얼**: 상세한 `USER_MANUAL.md` 추가
- **📋 버전 히스토리**: 체계적인 `CHANGELOG.md` 추가
- **🔧 설정 가이드**: 데이터베이스 연결 및 설정 방법 상세 설명
- **💡 예시 확장**: 다양한 사용 사례 및 예제 코드 추가

### 🔧 개선사항
- **문서 구조화**: 목차 기반 체계적 문서 구성
- **예제 강화**: 실제 사용 시나리오별 상세 예시 제공
- **문제 해결 가이드**: 일반적인 문제 및 해결책 정리
- **버전 히스토리**: 모든 버전의 변경사항 체계적 정리

---

## v1.2.0 - 쿼리 재사용 및 CLI 개선 (2024-08-07)

### ✨ 새로운 기능
- **🔄 쿼리 정의 재사용 기능**: `queryDefs`를 통한 공통 쿼리 정의 및 재사용
- **🖥️ 새로운 CLI 인터페이스**: `excel-cli.js`를 통한 명령줄 도구 제공
- **🪟 윈도우 배치 파일**: 윈도우 사용자를 위한 편리한 실행 배치 파일들
- **✅ 파일 검증 기능**: 쿼리 파일 형식 및 구조 검증 도구
- **🔗 DB 연결 테스트**: 모든 설정된 데이터베이스 연결 상태 확인

### 📊 쿼리 재사용 시스템
- **XML/JSON 지원**: 두 형식 모두에서 `queryDefs` 기능 지원
- **코드 재사용**: 동일한 쿼리를 여러 시트에서 `queryRef`로 참조
- **유지보수 효율성**: 한 곳에서 쿼리 수정 시 모든 참조 시트에 자동 적용
- **가독성 향상**: 복잡한 쿼리를 의미있는 이름으로 명명

### 🖥️ CLI 명령어 추가
```bash
# 엑셀 파일 생성
node src/excel-cli.js export --xml ./queries/sample.xml

# 쿼리 파일 검증  
node src/excel-cli.js validate --xml ./queries/sample.xml

# DB 연결 테스트
node src/excel-cli.js list-dbs

# 도움말
node src/excel-cli.js help
```

### 🪟 윈도우 배치 파일
- `실행하기.bat`: 메인 인터랙티브 메뉴
- `sql2excel.bat`: 통합 실행 메뉴
- `export-xml.bat`: XML 파일 빠른 실행
- `export-json.bat`: JSON 파일 빠른 실행
- `validate.bat`: 파일 검증 빠른 실행
- `db-test.bat`: DB 연결 테스트

### 🔧 개선사항
- **NPM 스크립트**: 편리한 NPM 명령어 추가
- **오류 처리 강화**: 더 친화적인 오류 메시지
- **파일 자동 감지**: XML/JSON 파일 자동 인식
- **결과 확인**: 생성된 파일 폴더 자동 열기 옵션

### 📝 사용 예시
```xml
<!-- 쿼리 정의 -->
<queryDefs>
  <queryDef name="common_orders" description="공통 주문 조회">
    <![CDATA[
      SELECT OrderID, CustomerID, OrderDate, TotalAmount
      FROM Orders WHERE OrderDate >= '${startDate}'
    ]]>
  </queryDef>
</queryDefs>

<!-- 쿼리 참조 -->
<sheet name="Orders" queryRef="common_orders" use="true"/>
```

---

## v1.1.0 - 고급 기능 확장 (2024-07-22)

### ✨ 새로운 기능
- **📋 자동 목차 시트**: 모든 엑셀 파일에 목차 시트 자동 생성
- **📊 컬럼별 집계**: 지정 컬럼의 값별 건수 자동 집계 및 표시
- **🚦 조회 건수 제한**: `maxRows` 속성으로 대용량 데이터 안전 처리
- **🔗 시트별 다중 DB 연결**: 각 시트마다 다른 데이터베이스 연결 가능
- **📊 DB 출처 표시**: 각 시트 상단에 데이터 출처 DB명 자동 표시

### 📋 자동 목차 시트 기능
- **하이퍼링크**: 시트명, 데이터 건수 클릭 시 해당 시트로 이동
- **집계 정보**: `aggregateColumn` 지정 시 값별 건수 표시
- **데이터 건수**: 천 단위 구분자로 표시
- **파란색 탭**: 목차 시트를 쉽게 구분

### 📊 집계 기능 상세
```xml
<sheet name="주문목록" aggregateColumn="주문상태" maxRows="1000">
  <!-- 결과: [주문상태] Shipped:89, Processing:45, Cancelled:16 외 2개 -->
</sheet>
```

### 🔗 다중 DB 연결
```xml
<excel db="mainDB">
  <sheet name="주문데이터" db="orderDB">
    <!-- orderDB에서 데이터 조회 -->
  </sheet>
  <sheet name="고객데이터" db="customerDB">
    <!-- customerDB에서 데이터 조회 -->
  </sheet>
</excel>
```

### 🚦 조회 건수 제한
- SQL 쿼리에 `TOP N` 절 자동 추가
- 기존 `TOP` 절 있을 경우 무시 및 경고
- 콘솔에 제한 적용 메시지 표시

### 🔧 개선사항
- **DB 연결 풀 관리**: 동일 DB 연결 재사용으로 성능 향상
- **오류 처리 강화**: DB 연결 실패 시 상세한 오류 정보 제공
- **메모리 최적화**: 대용량 데이터 처리 시 메모리 사용량 개선

---

## v1.0.0 - 초기 릴리즈 (2024-01-15)

### ✨ 핵심 기능
- **📊 멀티 시트 엑셀 생성**: 여러 SQL 쿼리 결과를 하나의 엑셀 파일에 시트별로 저장
- **🎨 엑셀 스타일링**: 헤더/데이터 영역 각각 폰트, 색상, 테두리, 정렬 등 세부 스타일 설정
- **📝 변수 시스템**: 쿼리 내 `${변수명}` 형태로 동적 쿼리 생성
- **📄 XML/JSON 지원**: 유연한 설정 파일 형식 지원
- **🔧 CLI 실행**: 명령줄 인터페이스로 간편한 실행

### 📊 엑셀 스타일 기능
- **헤더 스타일**: 폰트, 색상, 배경, 정렬, 테두리 개별 설정
- **데이터 스타일**: 본문 데이터 영역 별도 스타일 적용
- **컬럼 너비**: 데이터 길이에 따른 자동 조정 (최소/최대값 설정)
- **색상 지원**: ARGB 16진수 형식으로 세밀한 색상 제어

### 📝 변수 시스템
```xml
<vars>
  <var name="startDate">2024-01-01</var>
  <var name="endDate">2024-12-31</var>
</vars>

<sheet name="매출_${startDate}_${endDate}">
  <![CDATA[
    SELECT * FROM Sales 
    WHERE SaleDate >= '${startDate}' AND SaleDate <= '${endDate}'
  ]]>
</sheet>
```

### 📄 설정 파일 형식
- **XML 형식**: 태그 기반 구조적 설정
- **JSON 형식**: 객체 기반 직관적 설정
- **CDATA 지원**: XML에서 복잡한 SQL 쿼리 안전하게 포함

### 🔧 기본 실행 방법
```bash
# XML 설정 파일 사용
node src/index.js --xml ./queries/sample.xml

# JSON 설정 파일 사용  
node src/index.js --query ./queries/sample.json

# 변수 덮어쓰기
node src/index.js --xml ./queries/sample.xml --var "year=2024"
```

### 🗄️ 데이터베이스 지원
- **SQL Server**: MSSQL 전용 지원
- **연결 관리**: config/dbinfo.json을 통한 연결 정보 관리
- **보안**: 암호화 연결 및 인증서 검증 옵션

### 📁 파일 구조
```
src/
├── index.js                    # 메인 실행 파일
├── excel-style-helper.js       # 엑셀 스타일 유틸리티
config/
├── dbinfo.json                 # 데이터베이스 연결 설정
queries/
├── queries-sample.xml          # XML 샘플 설정
├── queries-sample.json         # JSON 샘플 설정
resources/
├── create_sample_tables.sql    # 샘플 테이블 생성 스크립트
├── insert_sample_data.sql      # 샘플 데이터 입력 스크립트
```

### 🧪 테스트 환경
- **샘플 데이터베이스**: 테스트용 테이블 및 데이터 제공
- **샘플 쿼리**: 즉시 실행 가능한 예제 설정 파일
- **테스트 스크립트**: 기능 검증용 테스트 파일들

---

## 📋 버전별 주요 변경사항 요약

| 버전 | 주요 기능 | 릴리즈 일자 |
|------|-----------|-------------|
| **v1.2.1** | 문서화 개선, 사용자 매뉴얼 추가 | 2025-08-11 |
| **v1.2.0** | 쿼리 재사용, CLI 개선, 윈도우 배치 파일 | 2025-08-07 |
| **v1.1.0** | 자동 목차, 집계 기능, 다중 DB, 조회 제한 | 2025-07-22 |
| **v1.0.0** | 초기 릴리즈, 기본 엑셀 생성 기능 | 2025-01-15 |

## 🔄 업그레이드 가이드

### v1.1.0에서 v1.2.0으로
1. **새로운 CLI 도구 사용 권장**:
   ```bash
   # 기존 방식 (여전히 지원)
   node src/index.js --xml queries.xml
   
   # 새로운 방식 (권장)
   node src/excel-cli.js export --xml queries.xml
   ```

2. **쿼리 재사용 기능 활용**:
   - 중복되는 쿼리를 `queryDefs`로 정의
   - `queryRef` 속성으로 참조하여 사용

3. **윈도우 배치 파일 활용**:
   - `실행하기.bat` 또는 `sql2excel.bat`로 편리한 실행

### v1.0.0에서 v1.1.0으로
1. **기존 설정 파일 호환**: 모든 기존 XML/JSON 파일 그대로 사용 가능
2. **새로운 기능 추가 활용**:
   ```xml
   <sheet name="주문목록" aggregateColumn="주문상태" maxRows="1000" db="orderDB">
   ```
3. **목차 시트 자동 생성**: 별도 설정 없이 자동으로 목차 시트 생성됨

## 🐛 알려진 이슈

### v1.2.0
- Windows 배치 파일이 일부 특수 문자 포함 경로에서 오동작할 수 있음
- 매우 긴 쿼리 정의명(100자 이상)에서 오류 발생 가능

### v1.1.0  
- 매우 대용량 데이터(100만 건 이상) 처리 시 메모리 부족 가능
- 일부 복잡한 SQL 쿼리에서 TOP 절 자동 삽입 위치 오류 가능

### v1.0.0
- 테이블명에 공백이 포함된 경우 컬럼 너비 계산 오류
- 일부 특수문자가 포함된 데이터에서 엑셀 포맷 오류

---

## 📞 지원 정보
- **웹사이트**: sql2excel.com
- **이메일**: sql2excel.nodejs@gmail.com
- **GitHub**: [Repository URL]

각 버전의 상세한 기능 설명은 `USER_MANUAL.md`를 참조하세요.
