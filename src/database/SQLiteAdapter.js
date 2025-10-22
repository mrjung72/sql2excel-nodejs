const Database = require('better-sqlite3');
const { getMessages } = require('../utils/messages');
const { formatDate, createInClause } = require('../utils/date-utils');

/**
 * SQLite 데이터베이스 어댑터 (using better-sqlite3)
 */
class SQLiteAdapter {
  constructor(config, language = 'en') {
    this.config = config;
    this.msg = getMessages('database', language);
    this.dbConnections = {}; // SQLite는 파일 기반이므로 connection 저장
    this.dbType = 'sqlite';
  }

  /**
   * SQLite 연결 생성
   * @param {Object} config - SQLite 연결 설정
   * @param {string} dbKey - 데이터베이스 키
   * @returns {Promise<Object>} 연결 객체
   */
  async createConnectionPool(config, dbKey) {
    if (!this.dbConnections[dbKey]) {
      if (!config) {
        throw new Error(`${this.msg.dbIdNotFound} ${dbKey}`);
      }

      console.log(`[DB] ${dbKey} ${this.msg.dbConnecting}`);

      // SQLite는 파일 경로를 사용 (server 필드에 파일 경로 저장)
      const dbPath = config.database || config.server || ':memory:';
      const options = {
        readonly: config.options?.readonly || false,
        fileMustExist: config.options?.fileMustExist || false,
        timeout: config.options?.timeout || 5000,
        verbose: config.options?.verbose || null
      };

      try {
        const db = new Database(dbPath, options);
        this.dbConnections[dbKey] = db;
        console.log(`[DB] ${dbKey} ${this.msg.dbConnected} (${dbPath})`);
        return db;
      } catch (error) {
        throw error;
      }
    }
    return this.dbConnections[dbKey];
  }

  /**
   * SQLite 쿼리 실행
   * @param {Object} db - SQLite 연결 객체
   * @param {string} sql - SQL 쿼리
   * @returns {Promise<Object>} 쿼리 결과 (MSSQL 형식과 호환)
   */
  async executeQuery(db, sql) {
    try {
      // SELECT 쿼리인지 확인
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

      if (isSelect) {
        const rows = db.prepare(sql).all();

        // MSSQL 결과 형식과 호환되도록 변환
        return {
          recordset: rows,
          recordsets: [rows],
          rowsAffected: [rows.length],
          output: {},
          rowCount: rows.length
        };
      } else {
        // INSERT, UPDATE, DELETE 등
        const result = db.prepare(sql).run();

        return {
          recordset: [],
          recordsets: [[]],
          rowsAffected: [result.changes || 0],
          output: {},
          rowCount: result.changes || 0
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * SQLite LIMIT 절 추가 (SQLite 특화)
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
   * SQLite datetime() 함수 대체 (SQLite 특화)
   * @param {string} sql - SQL 쿼리
   * @returns {string} datetime() 함수가 치환된 SQL
   */
  replaceGetDateFunction(sql) {
    // SQLite는 datetime('now') 함수를 사용하므로, GETDATE()를 datetime('now')로 변경
    return sql.replace(/\bGETDATE\(\)\b/gi, "datetime('now')");
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
   * SQLite IN 절 생성 (재사용 가능한 유틸리티 함수 사용)
   * @param {Array} values - 값 배열
   * @returns {string} IN 절 문자열
   */
  createInClause(values) {
    return createInClause(values);
  }

  /**
   * SQLite 연결 설정 검증
   * @param {Object} config - 연결 설정
   * @returns {boolean} 유효성 여부
   */
  validateConnectionConfig(config) {
    // SQLite는 파일 기반이므로 database 또는 server 필드만 필요
    return config.hasOwnProperty('database') || config.hasOwnProperty('server');
  }

  /**
   * SQLite 연결 종료
   * @param {string} dbKey - 데이터베이스 키
   */
  async closeConnection(dbKey) {
    if (this.dbConnections[dbKey]) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        this.dbConnections[dbKey].close();
      } catch (error) {
        console.warn(`Warning: SQLite disconnect error: ${error.message}`);
      }
      delete this.dbConnections[dbKey];
    }
  }

  /**
   * 모든 SQLite 연결 종료
   */
  async closeAllConnections() {
    for (const [dbKey, db] of Object.entries(this.dbConnections)) {
      console.log(`[DB] ${dbKey} ${this.msg.dbClosing}`);
      try {
        db.close();
      } catch (error) {
        console.warn(`Warning: SQLite disconnect error: ${error.message}`);
      }
    }
    this.dbConnections = {};
  }

  /**
   * SQLite 특화 에러 처리
   * @param {Error} error - 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  formatErrorMessage(error) {
    if (error.code === 'SQLITE_CANTOPEN') {
      return 'SQLite Error: Cannot open database file. Check file path and permissions.';
    } else if (error.code === 'SQLITE_CORRUPT') {
      return 'SQLite Error: Database file is corrupted.';
    } else if (error.code === 'SQLITE_NOTADB') {
      return 'SQLite Error: File is not a database file.';
    } else if (error.code === 'SQLITE_READONLY') {
      return 'SQLite Error: Database is read-only.';
    } else if (error.errno === 14 || error.message.includes('unable to open')) {
      return 'SQLite Error: Cannot open database file. Check file path and permissions.';
    } else {
      return `SQLite Error: ${error.message}`;
    }
  }

  /**
   * SQLite 연결 상태 확인
   * @param {string} dbKey - 데이터베이스 키
   * @returns {boolean} 연결 상태
   */
  isConnected(dbKey) {
    return this.dbConnections[dbKey] !== undefined;
  }

  /**
   * SQLite 연결 정보 조회
   * @returns {Object} 연결 정보
   */
  getConnectionInfo() {
    const info = {};
    for (const [dbKey] of Object.entries(this.dbConnections)) {
      info[dbKey] = {
        connected: true,
        type: 'file-based'
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

module.exports = SQLiteAdapter;

