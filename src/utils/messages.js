/**
 * 다국어 메시지 중앙 관리 모듈
 */

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

/**
 * 데이터베이스 관련 메시지
 */
const databaseMessages = {
    en: {
        dbIdNotFound: 'DB connection ID not found:',
        dbConnecting: 'connecting to database...',
        dbConnected: 'database connected',
        dbClosing: 'closing database connection',
        errorLogin: 'Database login failed: Check username or password.',
        errorAuth: 'Database authentication failed: Check username or password.',
        errorSocket: 'Database connection failed: Check server address and port.',
        errorConnection: 'Database connection failed: Check server address and port.',
        errorName: 'Database name error: Check database name.',
        errorDatabase: 'Database error: Check database name.',
        errorTimeout: 'Query execution timeout: Optimize query or increase timeout.',
        errorAlreadyConnected: 'Database already connected.',
        errorNotOpen: 'Database connection is not open.',
        mssqlError: 'MSSQL Error:',
        mysqlError: 'MySQL Error:',
        unsupportedDbType: 'Unsupported database type:',
        requiredConfigMissing: 'Required configuration is missing:',
        portInvalid: 'Port number must be between 1-65535.'
    },
    kr: {
        dbIdNotFound: 'DB 접속 ID를 찾을 수 없습니다:',
        dbConnecting: '데이터베이스에 연결 중...',
        dbConnected: '데이터베이스 연결 완료',
        dbClosing: '데이터베이스 연결 종료',
        errorLogin: '데이터베이스 로그인 실패: 사용자명 또는 비밀번호를 확인하세요.',
        errorAuth: '데이터베이스 인증 실패: 사용자명 또는 비밀번호를 확인하세요.',
        errorSocket: '데이터베이스 연결 실패: 서버 주소와 포트를 확인하세요.',
        errorConnection: '데이터베이스 연결 실패: 서버 주소와 포트를 확인하세요.',
        errorName: '데이터베이스 이름 오류: 데이터베이스 이름을 확인하세요.',
        errorDatabase: '데이터베이스 오류: 데이터베이스 이름을 확인하세요.',
        errorTimeout: '쿼리 실행 시간 초과: 쿼리를 최적화하거나 타임아웃을 늘려주세요.',
        errorAlreadyConnected: '이미 연결된 데이터베이스입니다.',
        errorNotOpen: '데이터베이스 연결이 열려있지 않습니다.',
        mssqlError: 'MSSQL 오류:',
        mysqlError: 'MySQL 오류:',
        unsupportedDbType: '지원하지 않는 데이터베이스 유형:',
        requiredConfigMissing: '필수 설정이 누락되었습니다:',
        portInvalid: '포트 번호는 1-65535 사이여야 합니다.'
    }
};

/**
 * 변수 처리 관련 메시지
 */
const variableMessages = {
    en: {
        dynamicVarSet: 'Dynamic variable set:',
        dynamicVarProcessStart: '\n🔄 Dynamic variable processing started',
        dynamicVarProcessing: '\n📊 Processing dynamic variable:',
        noDesc: 'no description',
        database: '   Database:',
        dynamicVarSpecified: 'dynamic variable specified',
        default: 'default',
        keyValuePairs: '   ✅',
        keyValuePairsText: 'key-value pairs',
        keyValuePairsNeedMin2Cols: '   ⚠️',
        keyValuePairsNeedMin2ColsText: 'key_value_pairs type requires at least 2 columns',
        columnsRows: '   ✅',
        columnsText: 'columns,',
        rowsText: 'rows',
        noResults: '   ⚠️',
        noResultsText: 'No query results',
        processError: '   ❌',
        processErrorText: 'Error during processing:',
        dynamicVarProcessComplete: '\n✅ Dynamic variable processing completed',
        variableSubstStart: 'Variable substitution started:',
        dynamicVarSub: 'Dynamic variable',
        substituted: 'substituted:',
        array: 'array',
        toInClause: '→ IN clause',
        objectType: 'object type',
        errorDuring: 'Error during',
        substitution: 'substitution:',
        timestampFunc: 'Timestamp function',
        generalVar: 'General variable',
        envVar: 'Environment variable',
        simpleString: '(simple string)',
        skipped: 'skipped: already processed variable',
        unresolvedVars: 'Unresolved variables:',
        unresolvedDynamicVar: 'Unresolved dynamic variable',
        replacedWith: '→ replaced with',
        unresolvedVar: 'Unresolved variable',
        emptyString: '(empty string)',
        nullValue: '(no match)'
    },
    kr: {
        dynamicVarSet: '동적 변수 설정:',
        dynamicVarProcessStart: '\n🔄 동적 변수 처리 시작',
        dynamicVarProcessing: '\n📊 동적 변수 처리 중:',
        noDesc: '설명 없음',
        database: '   데이터베이스:',
        dynamicVarSpecified: '동적 변수 지정',
        default: '기본',
        keyValuePairs: '   ✅',
        keyValuePairsText: '키-값 쌍',
        keyValuePairsNeedMin2Cols: '   ⚠️',
        keyValuePairsNeedMin2ColsText: 'key_value_pairs 타입은 최소 2개의 컬럼이 필요합니다',
        columnsRows: '   ✅',
        columnsText: '컬럼,',
        rowsText: '행',
        noResults: '   ⚠️',
        noResultsText: '쿼리 결과 없음',
        processError: '   ❌',
        processErrorText: '처리 중 오류:',
        dynamicVarProcessComplete: '\n✅ 동적 변수 처리 완료',
        variableSubstStart: '변수 치환 시작:',
        dynamicVarSub: '동적 변수',
        substituted: '치환됨:',
        array: '배열',
        toInClause: '→ IN 절',
        objectType: '객체 타입',
        errorDuring: '오류 발생:',
        substitution: '치환:',
        timestampFunc: '타임스탬프 함수',
        generalVar: '일반 변수',
        envVar: '환경 변수',
        simpleString: '(단순 문자열)',
        skipped: '건너뜀: 이미 처리된 변수',
        unresolvedVars: '미해결 변수:',
        unresolvedDynamicVar: '미해결 동적 변수',
        replacedWith: '→ 교체됨:',
        unresolvedVar: '미해결 변수',
        emptyString: '(빈 문자열)',
        nullValue: '(일치 없음)'
    }
};

/**
 * 메시지 가져오기 함수
 * @param {string} category - 메시지 카테고리 ('database', 'variable')
 * @param {string} language - 언어 코드 ('en', 'kr')
 * @returns {Object} 해당 카테고리의 메시지 객체
 */
function getMessages(category, language = LANGUAGE) {
    const lang = language || 'en';
    
    switch (category) {
        case 'database':
            return databaseMessages[lang] || databaseMessages.en;
        case 'variable':
            return variableMessages[lang] || variableMessages.en;
        default:
            return {};
    }
}

module.exports = {
    getMessages,
    databaseMessages,
    variableMessages,
    LANGUAGE
};

