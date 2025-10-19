const mssql = require('mssql');

// 다국어 메시지
const messages = {
    en: {
        dbIdNotFound: 'DB connection ID not found:',
        dbConnecting: 'connecting to database...',
        dbConnected: 'database connected',
        dbClosing: 'closing database connection',
        errorLogin: 'Database login failed: Check username or password.',
        errorSocket: 'Database connection failed: Check server address and port.',
        errorName: 'Database name error: Check database name.',
        errorTimeout: 'Query execution timeout: Optimize query or increase timeout.',
        errorAlreadyConnected: 'Database already connected.',
        errorNotOpen: 'Database connection is not open.',
        mssqlError: 'MSSQL Error:'
    },
    kr: {
        dbIdNotFound: 'DB 접속 ID를 찾을 수 없습니다:',
        dbConnecting: '데이터베이스에 연결 중...',
        dbConnected: '데이터베이스 연결 완료',
        dbClosing: '데이터베이스 연결 종료',
        errorLogin: '데이터베이스 로그인 실패: 사용자명 또는 비밀번호를 확인하세요.',
        errorSocket: '데이터베이스 연결 실패: 서버 주소와 포트를 확인하세요.',
        errorName: '데이터베이스 이름 오류: 데이터베이스 이름을 확인하세요.',
        errorTimeout: '쿼리 실행 시간 초과: 쿼리를 최적화하거나 타임아웃을 늘려주세요.',
        errorAlreadyConnected: '이미 연결된 데이터베이스입니다.',
        errorNotOpen: '데이터베이스 연결이 열려있지 않습니다.',
        mssqlError: 'MSSQL 오류:'
    }
};

/**
 * MSSQL 특화 기능들을 담당하는 헬퍼 모듈
 */
class MSSQLHelper {
  constructor(language = 'en') {
    this.dbPools = {};
    this.msg = messages[language] || messages.en;
  }

  /**
   * MSSQL 연결 풀 생성
   * @param {Object} config - MSSQL 연결 설정
   * @param {string} dbKey - 데이터베이스 키
   * @returns {Promise<mssql.ConnectionPool>} 연결 풀
   */
  async createConnectionPool(config, dbKey) {
    if (!this.dbPools[dbKey]) {
      if (!config) {
        throw new Error(`${this.msg.dbIdNotFound} ${dbKey}`);
      }
      
      console.log(`[DB] ${dbKey} ${this.msg.dbConnecting}`);
      const pool = new mssql.ConnectionPool(config);
      await pool.connect();
      this.dbPools[dbKey] = pool;
      console.log(`[DB] ${dbKey} ${this.msg.dbConnected}`);
    }
    return this.dbPools[dbKey];
  }

  /**
   * MSSQL 쿼리 실행
   * @param {mssql.ConnectionPool} pool - 연결 풀
   * @param {string} sql - SQL 쿼리
   * @returns {Promise<Object>} 쿼리 결과
   */
  async executeQuery(pool, sql) {
    return await pool.request().query(sql);
  }

  /**
   * MSSQL TOP 절 추가 (MSSQL 특화)
   * @param {string} sql - 원본 SQL 쿼리
   * @param {number} maxRows - 최대 행 수
   * @returns {string} TOP 절이 추가된 SQL
   */
  addTopClause(sql, maxRows) {
    if (!maxRows || maxRows <= 0) return sql;
    
    // SQL에 TOP 절이 없는 경우에만 추가
    if (!sql.trim().toUpperCase().includes('TOP ')) {
      // SELECT 다음에 TOP N을 삽입
      return sql.replace(/^\s*SELECT\s+/i, `SELECT TOP ${maxRows} `);
    }
    return sql;
  }

  /**
   * MSSQL GETDATE() 함수 대체 (MSSQL 특화)
   * @param {string} sql - SQL 쿼리
   * @returns {string} GETDATE() 함수가 치환된 SQL
   */
  replaceGetDateFunction(sql) {
    // MSSQL의 GETDATE() 함수를 JavaScript Date로 치환
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return sql.replace(/\bGETDATE\(\)\b/gi, `'${currentDate}'`);
  }

  /**
   * MSSQL 특화 타임스탬프 함수들
   * @returns {Object} 타임스탬프 함수들
   */
  getTimestampFunctions() {
    return {
      // 기본 시각 함수들
      'CURRENT_TIMESTAMP': () => {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }, // YYYY-MM-DD HH:mm:ss
      'CURRENT_DATETIME': () => {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }, // YYYY-MM-DD HH:mm:ss
      'NOW': () => {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }, // YYYY-MM-DD HH:mm:ss
      'CURRENT_DATE': () => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
      }, // YYYY-MM-DD
      'CURRENT_TIME': () => {
        const now = new Date();
        return now.toTimeString().slice(0, 8);
      }, // HH:mm:ss
      'GETDATE': () => {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace('T', ' ');
      }, // SQL Server GETDATE() equivalent
      
      // 한국 시간대 함수들
      'KST_NOW': () => {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toISOString().slice(0, 19).replace('T', ' ');
      }, // 한국 시간 YYYY-MM-DD HH:mm:ss
      'KST_DATE': () => {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toISOString().slice(0, 10);
      }, // 한국 날짜 YYYY-MM-DD
      'KST_TIME': () => {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toISOString().slice(11, 19);
      }, // 한국 시간 HH:mm:ss
      'KST_DATETIME': () => {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toISOString().slice(0, 19).replace('T', ' ');
      }, // 한국 날짜시간
      
      // 한국식 날짜 형식
      'KOREAN_DATE': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return kst.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }, // YYYY년 M월 D일
      'KOREAN_DATETIME': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return kst.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
      }, // YYYY년 M월 D일 HH:mm:ss
      'KOREAN_DATE_SHORT': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return kst.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }, // YYYY. MM. DD.
      
      // 다양한 형식들
      'DATE_YYYYMMDD': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const year = kst.getFullYear();
        const month = String(kst.getMonth() + 1).padStart(2, '0');
        const day = String(kst.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      }, // YYYYMMDD
      'DATE_YYYY_MM_DD': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const year = kst.getFullYear();
        const month = String(kst.getMonth() + 1).padStart(2, '0');
        const day = String(kst.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }, // YYYY-MM-DD (한국 시간)
      'DATETIME_YYYYMMDD_HHMMSS': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const year = kst.getFullYear();
        const month = String(kst.getMonth() + 1).padStart(2, '0');
        const day = String(kst.getDate()).padStart(2, '0');
        const hour = String(kst.getHours()).padStart(2, '0');
        const minute = String(kst.getMinutes()).padStart(2, '0');
        const second = String(kst.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}_${hour}${minute}${second}`;
      }, // YYYYMMDD_HHMMSS
      
      // 타임스탬프 함수들
      'UNIX_TIMESTAMP': () => Math.floor(Date.now() / 1000), // Unix timestamp
      'TIMESTAMP_MS': () => Date.now(), // Milliseconds timestamp
      'ISO_TIMESTAMP': () => {
        const now = new Date();
        return now.toISOString();
      }, // ISO 8601 format
      'KST_ISO_TIMESTAMP': () => {
        const now = new Date();
        const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toISOString();
      }, // 한국 시간 ISO 8601
      
      // 요일 정보
      'WEEKDAY_KR': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        return weekdays[kst.getDay()];
      }, // 한국어 요일
      'WEEKDAY_EN': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return weekdays[kst.getDay()];
      }, // 영어 요일
      
      // 월 정보
      'MONTH_KR': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return `${kst.getMonth() + 1}월`;
      }, // N월
      'YEAR_KR': () => {
        const now = new Date();
        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        return `${kst.getFullYear()}년`;
      } // YYYY년
    };
  }

  /**
   * MSSQL IN 절 생성 (MSSQL 특화)
   * @param {Array} values - 값 배열
   * @returns {string} IN 절 문자열
   */
  createInClause(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return "NULL"; // 빈 배열일 경우 NULL 반환 (숫자/문자열 타입 모두 안전)
    }
    
    return values.map(v => {
      if (typeof v === 'string') {
        return `'${v.replace(/'/g, "''")}'`; // SQL 인젝션 방지를 위한 따옴표 이스케이핑
      }
      return v;
    }).join(', ');
  }

  /**
   * MSSQL 연결 설정 검증
   * @param {Object} config - 연결 설정
   * @returns {boolean} 유효성 여부
   */
  validateConnectionConfig(config) {
    const requiredFields = ['server', 'database', 'user', 'password'];
    return requiredFields.every(field => config.hasOwnProperty(field));
  }

  /**
   * MSSQL 연결 풀 종료
   * @param {string} dbKey - 데이터베이스 키
   */
  async closeConnection(dbKey) {
    if (this.dbPools[dbKey]) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      await this.dbPools[dbKey].close();
      delete this.dbPools[dbKey];
    }
  }

  /**
   * 모든 MSSQL 연결 풀 종료
   */
  async closeAllConnections() {
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      await pool.close();
    }
    this.dbPools = {};
  }

  /**
   * MSSQL 특화 에러 처리
   * @param {Error} error - 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  formatErrorMessage(error) {
    if (error.code === 'ELOGIN') {
      return this.msg.errorLogin;
    } else if (error.code === 'ESOCKET') {
      return this.msg.errorSocket;
    } else if (error.code === 'ENAME') {
      return this.msg.errorName;
    } else if (error.code === 'ETIMEOUT') {
      return this.msg.errorTimeout;
    } else if (error.code === 'EALREADYCONNECTED') {
      return this.msg.errorAlreadyConnected;
    } else if (error.code === 'ENOTOPEN') {
      return this.msg.errorNotOpen;
    } else {
      return `${this.msg.mssqlError} ${error.message}`;
    }
  }

  /**
   * MSSQL 연결 상태 확인
   * @param {string} dbKey - 데이터베이스 키
   * @returns {boolean} 연결 상태
   */
  isConnected(dbKey) {
    return this.dbPools[dbKey] && this.dbPools[dbKey].connected;
  }

  /**
   * MSSQL 연결 풀 정보 조회
   * @returns {Object} 연결 풀 정보
   */
  getConnectionInfo() {
    const info = {};
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      info[dbKey] = {
        connected: pool.connected,
        size: pool.size,
        available: pool.available,
        pending: pool.pending,
        borrowed: pool.borrowed
      };
    }
    return info;
  }
}

module.exports = MSSQLHelper;
