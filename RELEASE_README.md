# SQL2Excel v1.2.3 배포판

SQL 쿼리 결과를 엑셀 파일로 저장하는 도구입니다.

## 📦 배포판 구성

```
sql2excel-v1.2.3/
├── sql2excel-v1.2.3.exe     # 메인 실행 파일
├── sql2excel.bat            # 메뉴 인터페이스
├── 실행하기.bat              # 빠른 실행
├── 빠른실행-XML내보내기.bat   # XML 샘플 실행
├── 빠른실행-JSON내보내기.bat  # JSON 샘플 실행
├── DB연결테스트.bat          # 데이터베이스 연결 테스트
├── config/
│   └── dbinfo.json          # 데이터베이스 연결 설정
├── queries/
│   ├── queries-sample.xml   # XML 쿼리 샘플
│   └── queries-sample.json  # JSON 쿼리 샘플
├── templates/
│   └── excel-styles.xml     # 엑셀 스타일 템플릿
├── output/                  # 출력 폴더
└── 문서 파일들...
```

## 🚀 빠른 시작

### 1. 데이터베이스 설정
`config/dbinfo.json` 파일을 열어 데이터베이스 연결 정보를 설정하세요.

```json
{
  "dbs": {
    "sampleDB": {
      "server": "your-server",
      "database": "your-database",
      "user": "your-username",
      "password": "your-password"
    }
  }
}
```

### 2. 실행 방법

#### 방법 1: 메뉴 인터페이스 사용
```
실행하기.bat
```
또는
```
sql2excel.bat
```

#### 방법 2: 명령줄 직접 실행
```
sql2excel-v1.2.3.exe export -x queries/queries-sample.xml
```

#### 방법 3: 빠른 실행 스크립트
- `빠른실행-XML내보내기.bat`: XML 샘플로 엑셀 생성
- `빠른실행-JSON내보내기.bat`: JSON 샘플로 엑셀 생성
- `DB연결테스트.bat`: 데이터베이스 연결 확인

## 📋 주요 기능

- **다중 시트 지원**: 하나의 엑셀 파일에 여러 시트 생성
- **변수 치환**: 쿼리에서 동적 변수 사용 가능
- **스타일링**: 다양한 엑셀 스타일 템플릿 제공
- **멀티 DB 지원**: 여러 데이터베이스 동시 사용
- **집계 기능**: 데이터 집계 및 통계 정보 제공

## 📚 자세한 사용법

- `USER_MANUAL_KR.md`: 한국어 사용자 매뉴얼
- `USER_MANUAL.md`: 영어 사용자 매뉴얼
- `README_KR.md`: 한국어 프로젝트 설명
- `README.md`: 영어 프로젝트 설명

## 🔧 문제 해결

### 데이터베이스 연결 오류
1. `DB연결테스트.bat` 실행하여 연결 상태 확인
2. `config/dbinfo.json`의 연결 정보 재확인
3. 방화벽 및 네트워크 설정 확인

### 쿼리 오류
1. `sql2excel.bat`에서 "쿼리문정의 파일 검증" 메뉴 사용
2. 쿼리 문법 및 테이블명 확인
3. 샘플 파일(`queries/` 폴더) 참고

## 📞 지원

문제가 발생하거나 문의사항이 있으시면 프로젝트 저장소의 Issues를 이용해주세요.

---
**SQL2Excel v1.2.3** - SQL 쿼리를 엑셀로, 간단하고 강력하게!
