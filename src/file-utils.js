const fs = require('fs');
const path = require('path');

// pkg 실행 파일 경로 처리
const APP_ROOT = process.pkg ? path.dirname(process.execPath) : process.cwd();

/**
 * 파일 관련 유틸리티 함수들을 담당하는 모듈
 */
class FileUtils {
  /**
   * 안전한 파일 읽기 (인코딩 문제 해결)
   * @param {string} filepath - 파일 경로
   * @param {string} encoding - 인코딩 (기본값: 'utf8')
   * @returns {string} 파일 내용
   */
  static readFileSafely(filepath, encoding = 'utf8') {
    try {
      return fs.readFileSync(filepath, encoding);
    } catch (error) {
      console.warn(`⚠️  파일 읽기 실패: ${filepath}`);
      console.warn(`   오류: ${error.message}`);
      throw new Error(`파일을 읽을 수 없습니다: ${filepath}`);
    }
  }

  /**
   * 경로 해결 (상대 경로를 절대 경로로 변환)
   * @param {string} p - 경로
   * @returns {string} 해결된 경로
   */
  static resolvePath(p) {
    if (!p) return '';
    if (path.isAbsolute(p)) return p;
    return path.join(APP_ROOT, p);
  }

  /**
   * 디렉토리 존재 확인 및 생성
   * @param {string} filePath - 파일 경로
   */
  static ensureDirExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 현재 타임스탬프 문자열 생성
   * @returns {string} yyyymmddhhmmss 형식의 타임스탬프
   */
  static getNowTimestampStr() {
    const d = new Date();
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /**
   * 사용 가능한 XML 파일 목록 출력
   * @param {string} directory - 검색할 디렉토리 (기본값: 'queries')
   */
  static printAvailableXmlFiles(directory = 'queries') {
    const dir = path.join(APP_ROOT, directory);
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml'));
    if (files.length > 0) {
      console.log('-------------------------------------------------------------------------------');
      console.log(`[INFO] 사용 가능한 XML 쿼리 정의 파일 목록:`);
      console.log('-------------------------------------------------------------------------------');
      files.forEach(f => console.log(`  - ${directory}/` + f));
      console.log('-------------------------------------------------------------------------------');
    } else {
      console.log(`[INFO] ${directory} 폴더에 XML 쿼리 정의 파일이 없습니다.`);
    }
  }

  /**
   * 파일 존재 여부 확인
   * @param {string} filepath - 파일 경로
   * @returns {boolean} 존재 여부
   */
  static exists(filepath) {
    return fs.existsSync(filepath);
  }

  /**
   * 파일 확장자 가져오기
   * @param {string} filepath - 파일 경로
   * @returns {string} 확장자
   */
  static getExtension(filepath) {
    return path.extname(filepath);
  }

  /**
   * 파일명 가져오기 (확장자 제외)
   * @param {string} filepath - 파일 경로
   * @returns {string} 파일명
   */
  static getBasename(filepath) {
    return path.basename(filepath, path.extname(filepath));
  }

  /**
   * 디렉토리명 가져오기
   * @param {string} filepath - 파일 경로
   * @returns {string} 디렉토리명
   */
  static getDirname(filepath) {
    return path.dirname(filepath);
  }

  /**
   * 파일 크기 가져오기
   * @param {string} filepath - 파일 경로
   * @returns {number} 파일 크기 (바이트)
   */
  static getFileSize(filepath) {
    try {
      const stats = fs.statSync(filepath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 파일 수정 시간 가져오기
   * @param {string} filepath - 파일 경로
   * @returns {Date} 수정 시간
   */
  static getModifiedTime(filepath) {
    try {
      const stats = fs.statSync(filepath);
      return stats.mtime;
    } catch (error) {
      return null;
    }
  }
}

module.exports = FileUtils;
