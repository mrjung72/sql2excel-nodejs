const oracledb = require('oracledb');
const { getMessages } = require('../utils/messages');
const { formatDate, createInClause } = require('../utils/date-utils');

/**
 * Oracle 데이터베이스 어댑터
 */
class OracleAdapter {
  constructor(config, language = 'en') {
    this.config = config;
    this.msg = getMessages('database', language);
    this.dbPools = {};
    this.dbType = 'oracle';

    // Recommended for performance
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  }

  /**
   * Oracle 연결 풀 생성
   * @param {Object} config - Oracle 연결 설정
   * @param {string} dbKey - 데이터베이스 키
   * @returns {Promise<oracledb.Pool>} 연결 풀
   */
  async createConnectionPool(config, dbKey) {
    if (!this.dbPools[dbKey]) {
      if (!config) {
        throw new Error(`${this.msg.dbIdNotFound} ${dbKey}`);
      }

      console.log(`[DB] ${dbKey} ${this.msg.dbConnecting}`);

      const host = config.server;
      const port = parseInt(config.port, 10) || 1521;
      const serviceName = config.serviceName || config.sid || config.database;
      const connectString = config.connectString || `${host}:${port}/${serviceName}`;

      const poolConfig = {
        user: config.user,
        password: config.password,
        connectString,
        poolMin: config.options?.poolMin ?? 0,
        poolMax: config.options?.poolMax ?? 4,
        poolIncrement: config.options?.poolIncrement ?? 1,
        queueTimeout: config.options?.queueTimeout ?? 30000,
        stmtCacheSize: config.options?.stmtCacheSize ?? 30
      };

      try {
        const pool = await oracledb.createPool(poolConfig);
        // Test a simple query
        const conn = await pool.getConnection();
        await conn.execute('SELECT 1 FROM dual');
        await conn.close();
        this.dbPools[dbKey] = pool;
        console.log(`[DB] ${dbKey} ${this.msg.dbConnected}`);
      } catch (error) {
        throw error;
      }
    }
    return this.dbPools[dbKey];
  }

  /**
   * Oracle 쿼리 실행
   * @param {oracledb.Pool} pool - 연결 풀
   * @param {string} sql - SQL 쿼리
   * @returns {Promise<Object>} 쿼리 결과 (MSSQL 형식과 호환)
   */
  async executeQuery(pool, sql) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(sql);

      const rows = result.rows || [];

      return {
        recordset: rows,
        recordsets: [rows],
        rowsAffected: [result.rowsAffected ?? (Array.isArray(rows) ? rows.length : 0)],
        output: {},
        rowCount: Array.isArray(rows) ? rows.length : 0
      };
    } catch (error) {
      throw error;
    } finally {
      if (connection) {
        try { await connection.close(); } catch (_) {}
      }
    }
  }

  /**
   * Oracle 페이징/제한절 추가 (12c+): FETCH FIRST N ROWS ONLY
   */
  addTopClause(sql, maxRows) {
    if (!maxRows || maxRows <= 0) return sql;
    const upper = sql.trim().toUpperCase();
    if (upper.includes('FETCH FIRST') || upper.includes('ROWNUM')) return sql;
    return `${sql.trim()} FETCH FIRST ${maxRows} ROWS ONLY`;
  }

  /**
   * GETDATE() 치환 → SYSTIMESTAMP
   */
  replaceGetDateFunction(sql) {
    return sql.replace(/\bGETDATE\(\)\b/gi, 'SYSTIMESTAMP');
  }

  /** 날짜 포맷팅 위임 */
  formatDate(date, format) { return formatDate(date, format); }

  /** IN 절 생성 위임 */
  createInClause(values) { return createInClause(values); }

  /**
   * Oracle 연결 설정 검증
   */
  validateConnectionConfig(config) {
    const requiredFields = ['server', 'user', 'password'];
    const hasHost = requiredFields.every(field => config.hasOwnProperty(field));
    const hasService = !!(config.serviceName || config.sid || config.database || config.connectString);
    return hasHost && hasService;
  }

  /** 연결 종료 */
  async closeConnection(dbKey) {
    if (this.dbPools[dbKey]) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await this.dbPools[dbKey].close(10);
      } catch (error) {
        console.warn(`Warning: Oracle disconnect error: ${error.message}`);
      }
      delete this.dbPools[dbKey];
    }
  }

  /** 모든 연결 종료 */
  async closeAllConnections() {
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        await pool.close(10);
      } catch (error) {
        console.warn(`Warning: Oracle disconnect error: ${error.message}`);
      }
    }
    this.dbPools = {};
  }

  /** 에러 메시지 매핑 */
  formatErrorMessage(error) {
    const message = error.message || '';
    if (message.includes('ORA-01017')) {
      return this.msg.errorAuth;
    } else if (message.includes('DPI-1047')) {
      return 'Oracle Client not found: Install Oracle Instant Client and set PATH.';
    } else if (message.includes('ORA-12154') || message.includes('ORA-12514') || message.includes('ORA-12541')) {
      return this.msg.errorConnection;
    } else if (message.includes('ORA-12545') || message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED')) {
      return this.msg.errorConnection;
    }
    return `Oracle Error: ${message}`;
  }

  /** 연결 상태 */
  isConnected(dbKey) {
    return this.dbPools[dbKey] !== undefined;
  }

  /** 연결 풀 정보 */
  getConnectionInfo() {
    const info = {};
    for (const [dbKey, pool] of Object.entries(this.dbPools)) {
      info[dbKey] = { connected: true, poolMin: pool.poolMin, poolMax: pool.poolMax, connectionsOpen: pool.connectionsOpen };
    }
    return info;
  }

  /** DB 타입 */
  getType() { return this.dbType; }
}

module.exports = OracleAdapter;
