/**
 * 날짜 관련 유틸리티 함수 모듈
 */

/**
 * 날짜 포맷팅 함수 (UTC 기준)
 * @param {Date} date - Date 객체
 * @param {string} format - 포맷 문자열 (YYYY, MM, DD, HH, mm, ss 등)
 * @returns {string} 포맷팅된 날짜 문자열
 * 
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
 * // => '2024-10-22 14:30:45'
 * 
 * formatDate(new Date(), 'YYYY년 MM월 DD일')
 * // => '2024년 10월 22일'
 */
function formatDate(date, format) {

    const map = {
      // Year
      'YYYY': String(date.getFullYear()),
      'yyyy': String(date.getFullYear()),
      'YY': String(date.getFullYear()).slice(-2),
      'yy': String(date.getFullYear()).slice(-2),
      // Month
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'M': String(date.getMonth() + 1),
      // Day
      'DD': String(date.getDate()).padStart(2, '0'),
      'dd': String(date.getDate()).padStart(2, '0'),
      'D': String(date.getDate()),
      'd': String(date.getDate()),
      // Hour
      'HH': String(date.getHours()).padStart(2, '0'),
      'hh': String(date.getHours()).padStart(2, '0'),
      'H': String(date.getHours()),
      'h': String(date.getHours()),
      // Minute
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'm': String(date.getMinutes()),
      // Second
      'ss': String(date.getSeconds()).padStart(2, '0'),
      's': String(date.getSeconds()),
      // Milliseconds
      'SSS': String(date.getMilliseconds()).padStart(3, '0'),
      'sss': String(date.getMilliseconds()).padStart(3, '0')
    };

    let result = format;
    const tokensInOrder = [
      'YYYY', 'yyyy', 'SSS', 'sss',
      'HH', 'hh', 'MM', 'DD', 'dd', 'YY', 'yy',
      'H', 'h', 'M', 'D', 'd', 'mm', 'ss', 'm', 's'
    ];
    tokensInOrder.forEach(token => {
      result = result.replace(new RegExp(token, 'g'), map[token]);
    });
    
    return result;
  }

/**
 * IN 절 생성 유틸리티
 * @param {Array} values - 값 배열
 * @returns {string} IN 절 문자열
 * 
 * @example
 * createInClause([1, 2, 3])
 * // => '1, 2, 3'
 * 
 * createInClause(['a', 'b', 'c'])
 * // => "'a', 'b', 'c'"
 * 
 * createInClause([])
 * // => 'NULL'
 */
function createInClause(values) {
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
 * 타임존별 UTC 오프셋 (분 단위)
 */
const timezoneOffsets = {
    'UTC': 0,           // 협정 세계시
    'GMT': 0,           // 그리니치 표준시 (UTC와 동일)
    'KST': 540,         // 한국 표준시 (UTC+9)
    'JST': 540,         // 일본 표준시 (UTC+9)
    'CST': 480,         // 중국 표준시 (UTC+8)
    'SGT': 480,         // 싱가포르 표준시 (UTC+8)
    'PHT': 480,         // 필리핀 표준시 (UTC+8)
    'AEST': 600,        // 호주 동부 표준시 (UTC+10)
    'ICT': 420,         // 인도차이나 표준시 (UTC+7) - 태국, 베트남
    'CET': 60,          // 중앙 유럽 표준시 (UTC+1) - 독일, 프랑스, 이탈리아, 폴란드
    'EET': 120,         // 동유럽 표준시 (UTC+2)
    'IST': 330,         // 인도 표준시 (UTC+5:30)
    'GST': 240,         // 걸프 표준시 (UTC+4)
    'EST': -300,        // 미국 동부 표준시 (UTC-5)
    'CST_US': -360,     // 미국/캐나다/멕시코 중부 표준시 (UTC-6)
    'MST': -420,        // 미국 산악 표준시 (UTC-7)
    'PST': -480,        // 미국 서부 표준시 (UTC-8)
    'AST': -240,        // 대서양 표준시 (UTC-4) - 캐나다 동부
    'AKST': -540,       // 알래스카 표준시 (UTC-9)
    'HST': -600,        // 하와이 표준시 (UTC-10)
    'BRT': -180,        // 브라질 표준시 (UTC-3)
    'ART': -180         // 아르헨티나 표준시 (UTC-3)
};

/**
 * 타임존에 맞는 날짜 생성
 * @param {string} timezone - 타임존 코드 (예: 'KST', 'UTC')
 * @returns {Date} 타임존이 적용된 날짜 객체
 */
function getDateByTimezone(timezone) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    const offsetMinutes = timezoneOffsets[timezone] || 0;
    return new Date(utcTime + (offsetMinutes * 60 * 1000));
}

/**
 * 현재 타임스탬프 문자열 생성
 * @param {string} format - 포맷 (기본값: 'YYYYMMDDHHmmss')
 * @returns {string} 타임스탬프 문자열
 */
function getNowTimestampStr(format = 'YYYYMMDDHHmmss') {
    return formatDate(new Date(), format);
}

module.exports = {
    formatDate,
    createInClause,
    timezoneOffsets,
    getDateByTimezone,
    getNowTimestampStr
};

