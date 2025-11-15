const mssql = require('mssql');
const { getMessages } = require('../utils/messages');
const { formatDate, createInClause } = require('../utils/date-utils');

/**
 * MSSQL 데이터베이스 어댑터
 */
class MSSQLAdapter {
  constructor(config, language = 'en') {
    this.config = config;
    this.msg = getMessages('database', language);
    this.dbPools = {};
    this.dbType = 'mssql';
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
   * 날짜 포맷팅 함수 (재사용 가능한 유틸리티 함수 사용)
   * @param {Date} date - Date 객체
   * @param {string} format - 포맷 문자열 (YYYY, MM, DD, HH, mm, ss 등)
   * @returns {string} 포맷팅된 날짜 문자열
   */
  formatDate(date, format) {
    return formatDate(date, format);
  }

  /**
   * MSSQL IN 절 생성 (재사용 가능한 유틸리티 함수 사용)
   * @param {Array} values - 값 배열
   * @returns {string} IN 절 문자열
   */
  createInClause(values) {
    return createInClause(values);
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

  /**
   * 데이터베이스 타입 반환
   * @returns {string} 데이터베이스 타입
   */
  getType() {
    return this.dbType;
  }

  /** 연결 테스트용 쿼리 */
  getTestQuery() {
    return 'SELECT 1 as test';
  }
}

module.exports = MSSQLAdapter;

