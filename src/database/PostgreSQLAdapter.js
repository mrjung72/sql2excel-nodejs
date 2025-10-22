const { Pool } = require('pg');
const { getMessages } = require('../utils/messages');
const { formatDate, createInClause } = require('../utils/date-utils');

/**
 * PostgreSQL 데이터베이스 어댑터
 */
class PostgreSQLAdapter {
  constructor(config, language = 'en') {
    this.config = config;
    this.msg = getMessages('database', language);
    this.dbPools = {}; // dbPools는 단일 Pool 객체를 저장
    this.dbType = 'postgresql';
  }

  /**
   * PostgreSQL 연결 풀 생성
   * @param {Object} config - PostgreSQL 연결 설정
   * @param {string} dbKey - 데이터베이스 키
   * @returns {Promise<Pool>} 연결 풀
   */
  async createConnectionPool(config, dbKey) {
    if (!this.dbPools[dbKey]) {
      if (!config) {
        throw new Error(`${this.msg.dbIdNotFound} ${dbKey}`);
      }

      console.log(`[DB] ${dbKey} ${this.msg.dbConnecting}`);

      const poolConfig = {
        host: config.server,
        port: parseInt(config.port, 10) || 5432,
        user: config.user,
        password: config.password,
        database: config.database,
        max: config.options?.max || 10,
        idleTimeoutMillis: config.options?.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.options?.connectionTimeout || 30000,
        ssl: config.options?.ssl || false
      };

      const pool = new Pool(poolConfig);

      // 연결 테스트
      try {
        await pool.query('SELECT 1');
        this.dbPools[dbKey] = pool;
        console.log(`[DB] ${dbKey} ${this.msg.dbConnected}`);
      } catch (error) {
        await pool.end();
        throw error;
      }
    }
    return this.dbPools[dbKey];
  }

  /**
   * PostgreSQL 쿼리 실행
   * @param {Pool} pool - 연결 풀
   * @param {string} sql - SQL 쿼리
   * @returns {Promise<Object>} 쿼리 결과 (MSSQL 형식과 호환)
   */
  async executeQuery(pool, sql) {
    try {
      const result = await pool.query(sql);

      // MSSQL 결과 형식과 호환되도록 변환
      return {
        recordset: result.rows,
        recordsets: [result.rows],
        rowsAffected: [result.rowCount],
        output: {},
        rowCount: result.rowCount
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * PostgreSQL LIMIT 절 추가 (PostgreSQL 특화)
   * @param {string} sql - 원본 SQL 쿼리
   * @param {number} maxRows - 최대 행 수
   * @returns {string} LIMIT 절이 추가된 SQL
   */
  addTopClause(sql, maxRows) {
    if (!maxRows || maxRows <= 0) return sql;

    // SQL에 LIMIT 절이 없는 경우에만 추가
    const upperSql = sql.trim().toUpperCase();
    if (!upperSql.includes('LIMIT ')) {
      // SQL 끝에 LIMIT N 추가
      return `${sql.trim()} LIMIT ${maxRows}`;
    }
    return sql;
  }

  /**
   * PostgreSQL NOW() 함수 대체 (PostgreSQL 특화)
   * @param {string} sql - SQL 쿼리
   * @returns {string} NOW() 함수가 치환된 SQL
   */
  replaceGetDateFunction(sql) {
    // PostgreSQL은 NOW() 함수를 지원하므로, GETDATE()를 NOW()로 변경
    return sql.replace(/\bGETDATE\(\)\b/gi, 'NOW()');
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
   * PostgreSQL IN 절 생성 (재사용 가능한 유틸리티 함수 사용)
   * @param {Array} values - 값 배열
   * @returns {string} IN 절 문자열
   */
  createInClause(values) {
    return createInClause(values);
  }

  /**
   * PostgreSQL 연결 설정 검증
   * @param {Object} config - 연결 설정
   * @returns {boolean} 유효성 여부
   */
  validateConnectionConfig(config) {
    const requiredFields = ['server', 'database', 'user', 'password'];
    return requiredFields.every(field => config.hasOwnProperty(field));
  }

  /**
   * PostgreSQL 연결 풀 종료
   * @param {string} dbKey - 데이터베이스 키
   */
  async closeConnection(dbKey) {
    if (this.dbPools[dbKey]) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await this.dbPools[dbKey].end();
      } catch (error) {
        console.warn(`Warning: PostgreSQL disconnect error: ${error.message}`);
      }
      delete this.dbPools[dbKey];
    }
  }

  /**
   * 모든 PostgreSQL 연결 풀 종료
   */
  async closeAllConnections() {
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await pool.end();
      } catch (error) {
        console.warn(`Warning: PostgreSQL disconnect error: ${error.message}`);
      }
    }
    this.dbPools = {};
  }

  /**
   * PostgreSQL 특화 에러 처리
   * @param {Error} error - 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  formatErrorMessage(error) {
    // PostgreSQL 에러 코드: https://www.postgresql.org/docs/current/errcodes-appendix.html
    if (error.code === '28P01') {
      return this.msg.errorAuth;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return this.msg.errorConnection;
    } else if (error.code === '3D000') {
      return this.msg.errorDatabase;
    } else if (error.code === 'ENOTFOUND') {
      return this.msg.errorConnection;
    } else {
      return `PostgreSQL Error: ${error.message}`;
    }
  }

  /**
   * PostgreSQL 연결 상태 확인
   * @param {string} dbKey - 데이터베이스 키
   * @returns {boolean} 연결 상태
   */
  isConnected(dbKey) {
    return this.dbPools[dbKey] !== undefined;
  }

  /**
   * PostgreSQL 연결 풀 정보 조회
   * @returns {Object} 연결 풀 정보
   */
  getConnectionInfo() {
    const info = {};
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      info[dbKey] = {
        connected: true,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
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
}

module.exports = PostgreSQLAdapter;

