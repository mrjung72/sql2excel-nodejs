const mysql = require('mysql2/promise');
const { getMessages } = require('../utils/messages');
const { formatDate, createInClause } = require('../utils/date-utils');

/**
 * MySQL/MariaDB 데이터베이스 어댑터
 */
class MySQLAdapter {
  constructor(config, language = 'en') {
    this.config = config;
    this.msg = getMessages('database', language);
    this.dbPools = {};
    this.dbType = 'mysql';
  }

  /**
   * MySQL 연결 생성 (Pool 대신 단일 Connection 사용)
   * @param {Object} config - MySQL 연결 설정
   * @param {string} dbKey - 데이터베이스 키
   * @returns {Promise<mysql.Connection>} 연결 객체
   */
  async createConnectionPool(config, dbKey) {
    if (!this.dbPools[dbKey]) {
      if (!config) {
        throw new Error(`${this.msg.dbIdNotFound} ${dbKey}`);
      }
      
      console.log(`[DB] ${dbKey} ${this.msg.dbConnecting}`);
      
      const connectionConfig = {
        host: config.server,
        port: parseInt(config.port, 10) || 3306,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: config.options?.connectionTimeout || 30000,
        ssl: config.options?.ssl || false
      };

      // Pool 대신 단일 Connection 사용 (client-util-app과 동일)
      const connection = await mysql.createConnection(connectionConfig);
      
      this.dbPools[dbKey] = connection;
      console.log(`[DB] ${dbKey} ${this.msg.dbConnected}`);
    }
    return this.dbPools[dbKey];
  }

  /**
   * MySQL 쿼리 실행
   * @param {mysql.Connection} connection - 연결 객체
   * @param {string} sql - SQL 쿼리
   * @returns {Promise<Object>} 쿼리 결과 (MSSQL 형식과 호환)
   */
  async executeQuery(connection, sql) {
    try {
      const [rows] = await connection.execute(sql);
      
      // MSSQL 결과 형식과 호환되도록 변환
      return {
        recordset: rows,
        recordsets: [rows],
        rowsAffected: [rows.affectedRows || rows.length],
        output: {},
        rowCount: Array.isArray(rows) ? rows.length : 0
      };
    } catch (error) {
      // 연결 에러 시 재연결 시도
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
        // 재연결은 createConnectionPool을 통해 자동으로 처리됨
        throw new Error(`${this.msg.errorConnection} - ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * MySQL LIMIT 절 추가 (MySQL 특화)
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
   * MySQL NOW() 함수 대체 (MySQL 특화)
   * @param {string} sql - SQL 쿼리
   * @returns {string} NOW() 함수가 치환된 SQL
   */
  replaceGetDateFunction(sql) {
    // MySQL은 NOW() 함수를 지원하므로, GETDATE()를 NOW()로 변경
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
   * MySQL IN 절 생성 (재사용 가능한 유틸리티 함수 사용)
   * @param {Array} values - 값 배열
   * @returns {string} IN 절 문자열
   */
  createInClause(values) {
    return createInClause(values);
  }

  /**
   * MySQL 연결 설정 검증
   * @param {Object} config - 연결 설정
   * @returns {boolean} 유효성 여부
   */
  validateConnectionConfig(config) {
    const requiredFields = ['server', 'database', 'user', 'password'];
    return requiredFields.every(field => config.hasOwnProperty(field));
  }

  /**
   * MySQL 연결 종료
   * @param {string} dbKey - 데이터베이스 키
   */
  async closeConnection(dbKey) {
    if (this.dbPools[dbKey]) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await this.dbPools[dbKey].end();
      } catch (error) {
        console.warn(`Warning: MySQL disconnect error: ${error.message}`);
      }
      delete this.dbPools[dbKey];
    }
  }

  /**
   * 모든 MySQL 연결 종료
   */
  async closeAllConnections() {
    for (const [dbKey, connection] of Object.entries(this.dbPools)) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await connection.end();
      } catch (error) {
        console.warn(`Warning: MySQL disconnect error: ${error.message}`);
      }
    }
    this.dbPools = {};
  }

  /**
   * MySQL 특화 에러 처리
   * @param {Error} error - 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  formatErrorMessage(error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return this.msg.errorAuth;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return this.msg.errorConnection;
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      return this.msg.errorDatabase;
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      return this.msg.errorConnection;
    } else {
      return `${this.msg.mysqlError} ${error.message}`;
    }
  }

  /**
   * MySQL 연결 상태 확인
   * @param {string} dbKey - 데이터베이스 키
   * @returns {boolean} 연결 상태
   */
  isConnected(dbKey) {
    return this.dbPools[dbKey] !== undefined;
  }

  /**
   * MySQL 연결 정보 조회
   * @returns {Object} 연결 정보
   */
  getConnectionInfo() {
    const info = {};
    for (const [dbKey, connection] of Object.entries(this.dbPools)) {
      info[dbKey] = {
        connected: true,
        threadId: connection.threadId
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

module.exports = MySQLAdapter;

