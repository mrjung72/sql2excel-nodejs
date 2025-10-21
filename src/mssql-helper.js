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
   * 날짜 포맷팅 함수 (UTC 기준)
   * @param {Date} date - Date 객체
   * @param {string} format - 포맷 문자열 (YYYY, MM, DD, HH, mm, ss 등)
   * @returns {string} 포맷팅된 날짜 문자열
   */
  formatDate(date, format) {
    // UTC 기준으로 날짜/시간 추출
    const map = {
      'YYYY': date.getUTCFullYear(),
      'YY': String(date.getUTCFullYear()).slice(-2),
      'MM': String(date.getUTCMonth() + 1).padStart(2, '0'),
      'M': date.getUTCMonth() + 1,
      'DD': String(date.getUTCDate()).padStart(2, '0'),
      'D': date.getUTCDate(),
      'HH': String(date.getUTCHours()).padStart(2, '0'),
      'H': date.getUTCHours(),
      'mm': String(date.getUTCMinutes()).padStart(2, '0'),
      'm': date.getUTCMinutes(),
      'ss': String(date.getUTCSeconds()).padStart(2, '0'),
      's': date.getUTCSeconds(),
      'SSS': String(date.getUTCMilliseconds()).padStart(3, '0')
    };

    let result = format;
    // 긴 패턴부터 먼저 치환 (YYYY를 YY보다 먼저)
    ['YYYY', 'MM', 'DD', 'HH', 'mm', 'ss', 'SSS', 'YY', 'M', 'D', 'H', 'm', 's'].forEach(token => {
      result = result.replace(new RegExp(token, 'g'), map[token]);
    });
    
    return result;
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
