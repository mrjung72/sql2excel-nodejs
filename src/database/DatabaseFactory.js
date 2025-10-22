const MSSQLAdapter = require('./MSSQLAdapter');
const MySQLAdapter = require('./MySQLAdapter');
const PostgreSQLAdapter = require('./PostgreSQLAdapter');
const SQLiteAdapter = require('./SQLiteAdapter');
const { getMessages } = require('../utils/messages');

/**
 * DatabaseFactory - 데이터베이스 타입에 따라 적절한 어댑터를 생성
 */
class DatabaseFactory {
  /**
   * 데이터베이스 연결 어댑터 생성
   * @param {string} dbType - 데이터베이스 타입 (mssql, mysql, mariadb, postgresql, sqlite)
   * @param {Object} config - 데이터베이스 연결 설정
   * @param {string} language - 언어 설정 (en/kr)
   * @returns {Object} 데이터베이스 어댑터 인스턴스
   */
  static createAdapter(dbType, config, language = 'en') {
    const msg = getMessages('database', language);
    const normalizedType = (dbType || 'mssql').toLowerCase();
    
    switch (normalizedType) {
      case 'mssql':
      case 'sqlserver':
        return new MSSQLAdapter(config, language);
      
      case 'mysql':
      case 'mariadb':
        return new MySQLAdapter(config, language);
      
      case 'postgresql':
      case 'postgres':
      case 'pg':
        return new PostgreSQLAdapter(config, language);
      
      case 'sqlite':
      case 'sqlite3':
        return new SQLiteAdapter(config, language);
      
      default:
        throw new Error(`${msg.unsupportedDbType} ${dbType}`);
    }
  }

  /**
   * 지원하는 데이터베이스 타입 목록
   * @returns {Array} 지원 DB 타입 정보
   */
  static getSupportedTypes() {
    return [
      { type: 'mssql', name: 'Microsoft SQL Server', defaultPort: 1433 },
      { type: 'mysql', name: 'MySQL', defaultPort: 3306 },
      { type: 'mariadb', name: 'MariaDB', defaultPort: 3306 },
      { type: 'postgresql', name: 'PostgreSQL', defaultPort: 5432 },
      { type: 'sqlite', name: 'SQLite', defaultPort: null }
    ];
  }

  /**
   * 데이터베이스 타입별 기본 포트 번호
   * @param {string} dbType - 데이터베이스 타입
   * @returns {number|null} 기본 포트 번호
   */
  static getDefaultPort(dbType) {
    const typeInfo = this.getSupportedTypes().find(t => t.type === dbType.toLowerCase());
    return typeInfo ? typeInfo.defaultPort : null;
  }

  /**
   * 데이터베이스 설정 유효성 검증
   * @param {string} dbType - 데이터베이스 타입
   * @param {Object} config - 데이터베이스 설정
   * @param {string} language - 언어 설정
   * @returns {boolean} 유효성 검증 결과
   */
  static validateConfig(dbType, config, language = 'en') {
    const msg = getMessages('database', language);
    const normalizedType = (dbType || 'mssql').toLowerCase();
    
    // SQLite는 파일 기반이므로 database 또는 server 필드만 필요
    if (normalizedType === 'sqlite' || normalizedType === 'sqlite3') {
      if (!config.database && !config.server) {
        throw new Error(`${msg.requiredConfigMissing} database or server (file path)`);
      }
      return true;
    }
    
    // 다른 DB들은 server, database, user, password 필요
    const requiredFields = ['server', 'database', 'user', 'password'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`${msg.requiredConfigMissing} ${missingFields.join(', ')}`);
    }

    // Port number validation (optional, use default if not provided)
    if (config.port) {
      const port = parseInt(config.port, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(msg.portInvalid);
      }
    }

    return true;
  }
}

module.exports = DatabaseFactory;

