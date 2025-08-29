const fs = require('fs');
const xml2js = require('xml2js');
const JSON5 = require('json5');
const FileUtils = require('./file-utils');

/**
 * 쿼리 파싱 관련 함수들을 담당하는 모듈
 */
class QueryParser {
  constructor() {
    this.fileUtils = FileUtils;
  }

  /**
   * XML 파일에서 쿼리 로드
   * @param {string} xmlPath - XML 파일 경로
   * @returns {Promise<Object>} 파싱된 쿼리 객체
   */
  async loadQueriesFromXML(xmlPath) {
    // 파일명 인코딩 문제 해결을 위한 안전한 파일 읽기
    const xml = FileUtils.readFileSafely(xmlPath, 'utf8');
    const parsed = await xml2js.parseStringPromise(xml, { trim: true });
    if (!parsed.queries || !parsed.queries.sheet) throw new Error('Invalid XML format');
    
    // 쿼리 정의 파싱
    let queryDefs = {};
    if (parsed.queries.queryDefs && parsed.queries.queryDefs[0] && parsed.queries.queryDefs[0].queryDef) {
      for (const queryDef of parsed.queries.queryDefs[0].queryDef) {
        if (queryDef.$ && (queryDef.$.id || queryDef.$.name)) {
          const queryName = queryDef.$.id || queryDef.$.name;
          const queryText = (queryDef._ || queryDef['#text'] || queryDef.__cdata || '').toString().trim();
          
          if (queryText) {
            queryDefs[queryName] = {
              name: queryName,
              description: queryDef.$.description || '',
              query: queryText
            };
          }
        }
      }
    }
    
    // 전역 변수 파싱
    let globalVars = {};
    if (parsed.queries.vars && parsed.queries.vars[0] && parsed.queries.vars[0].var) {
      for (const v of parsed.queries.vars[0].var) {
        if (v.$ && v.$.name && v._) {
          let value = v._.toString();
          // 배열 형태 문자열을 실제 배열로 변환
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // JSON 파싱 실패 시 문자열 그대로 사용
            }
          }
          // boolean 값 처리
          if (value === 'true') value = true;
          if (value === 'false') value = false;
          // 숫자 값 처리
          if (!isNaN(value) && !isNaN(parseFloat(value)) && typeof value === 'string') {
            value = parseFloat(value);
          }
          globalVars[v.$.name] = value;
        } else if (v.$ && v.$.name && typeof v === 'string') {
          let value = v;
          // 배열 형태 문자열을 실제 배열로 변환
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // JSON 파싱 실패 시 문자열 그대로 사용
            }
          }
          globalVars[v.$.name] = value;
        }
      }
    }
    
    // 동적 변수 파싱
    let dynamicVars = [];
    if (parsed.queries.dynamicVars && parsed.queries.dynamicVars[0] && parsed.queries.dynamicVars[0].dynamicVar) {
      const dynamicVarElements = Array.isArray(parsed.queries.dynamicVars[0].dynamicVar) 
        ? parsed.queries.dynamicVars[0].dynamicVar 
        : [parsed.queries.dynamicVars[0].dynamicVar];
      
      for (const dv of dynamicVarElements) {
        if (dv.$ && dv.$.name && dv._) {
          const query = dv._.toString().trim();
          const type = dv.$.type || 'column_identified';
          const description = dv.$.description || '';
          const database = dv.$.database || '';
          
          dynamicVars.push({
            name: dv.$.name,
            query: query,
            type: type,
            description: description,
            database: database
          });
          
          console.log(`동적 변수 정의 발견: ${dv.$.name} (타입: ${type}, 설명: ${description}, 데이터베이스: ${database || '기본값'})`);
        }
      }
    }
    
    // DB ID, output 경로 파싱
    let dbId = undefined;
    if (parsed.queries.db && parsed.queries.db[0] && parsed.queries.db[0].$ && parsed.queries.db[0].$.id) {
      dbId = parsed.queries.db[0].$.id;
    }
    let outputPath = undefined;
    if (parsed.queries.output && parsed.queries.output[0]) {
      outputPath = parsed.queries.output[0];
    }
    
    const sheets = parsed.queries.sheet.map(s => {
      let query = '';
      let sheetParams = {};
      
      // 시트별 파라미터 파싱
      if (s.params && s.params[0] && s.params[0].param) {
        const paramElements = Array.isArray(s.params[0].param) 
          ? s.params[0].param 
          : [s.params[0].param];
        
        for (const param of paramElements) {
          if (param.$ && param.$.name && param._) {
            let value = param._.toString();
            // 배열 형태 문자열을 실제 배열로 변환
            if (value.startsWith('[') && value.endsWith(']')) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // JSON 파싱 실패 시 문자열 그대로 사용
              }
            }
            // boolean 값 처리
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            // 숫자 값 처리
            if (!isNaN(value) && !isNaN(parseFloat(value)) && typeof value === 'string') {
              value = parseFloat(value);
            }
            sheetParams[param.$.name] = value;
          }
        }
      }
      
      // queryRef 속성이 있으면 쿼리 정의에서 참조
      if (s.$.queryRef) {
        const queryRef = s.$.queryRef;
        if (queryDefs[queryRef]) {
          query = queryDefs[queryRef].query;
          console.log(`[쿼리 참조] 시트 "${s.$.name}"이(가) 쿼리 정의 "${queryRef}"을(를) 참조합니다.`);
          
          // 시트별 파라미터가 있으면 로그 출력
          if (Object.keys(sheetParams).length > 0) {
            console.log(`[파라미터 재설정] 시트 "${s.$.name}"에서 파라미터 재설정:`, sheetParams);
          }
        } else {
          throw new Error(`쿼리 정의를 찾을 수 없습니다: ${queryRef} (시트: ${s.$.name})`);
        }
      } else {
        // 직접 쿼리가 있으면 사용
        query = (s._ || (s["_"] ? s["_"] : (s["$"] ? s["$"] : '')) || (s["__cdata"] ? s["__cdata"] : '') || (s["cdata"] ? s["cdata"] : '') || (s["#cdata-section"] ? s["#cdata-section"] : '') || (s["__text"] ? s["__text"] : '') || (s["#text"] ? s["#text"] : '') || (s["$text"] ? s["$text"] : '') || (s["$value"] ? s["$value"] : '') || (s["value"] ? s["value"] : '') || '').toString().trim();
      }
      
      return {
        name: s.$.name,
        use: s.$.use,
        aggregateColumn: s.$.aggregateColumn || null,
        maxRows: s.$.maxRows ? parseInt(s.$.maxRows) : null,
        db: s.$.db || null,
        queryRef: s.$.queryRef || null,
        style: s.$.style || null, // 시트별 스타일 추가
        params: sheetParams, // 시트별 파라미터 추가
        query: query
      };
    });
    
    return { globalVars, sheets, dbId, outputPath, queryDefs, dynamicVars };
  }

  /**
   * JSON 파일에서 쿼리 로드
   * @param {string} jsonPath - JSON 파일 경로
   * @returns {Object} 파싱된 쿼리 객체
   */
  loadQueriesFromJSON(jsonPath) {
    const queryContent = FileUtils.readFileSafely(jsonPath, 'utf8');
    const queries = JSON5.parse(queryContent);
    
    const globalVars = queries.vars || {};
    
    // JSON에서 쿼리 정의 파싱
    const queryDefs = queries.queryDefs || {};
    
    // JSON에서 동적 변수 파싱
    const dynamicVars = queries.dynamicVars || [];
    
    // JSON 시트에서 queryRef 처리
    const sheets = (queries.sheets || []).map(sheet => {
      let query = sheet.query || '';
      let sheetParams = sheet.params || {};
      
      // queryRef가 있으면 쿼리 정의에서 참조
      if (sheet.queryRef) {
        if (queryDefs[sheet.queryRef]) {
          query = queryDefs[sheet.queryRef].query || queryDefs[sheet.queryRef];
          console.log(`[쿼리 참조] 시트 "${sheet.name}"이(가) 쿼리 정의 "${sheet.queryRef}"을(를) 참조합니다.`);
          
          // 시트별 파라미터가 있으면 로그 출력
          if (Object.keys(sheetParams).length > 0) {
            console.log(`[파라미터 재설정] 시트 "${sheet.name}"에서 파라미터 재설정:`, sheetParams);
          }
        } else {
          throw new Error(`쿼리 정의를 찾을 수 없습니다: ${sheet.queryRef} (시트: ${sheet.name})`);
        }
      }
      
      return {
        ...sheet,
        params: sheetParams,
        query: query
      };
    });
    
    const dbId = queries.db;
    const outputPath = queries.output;
    
    return { globalVars, sheets, dbId, outputPath, queryDefs, dynamicVars };
  }

  /**
   * XML에서 엑셀 설정 파싱
   * @param {Object} parsed - 파싱된 XML 객체
   * @returns {Object} 엑셀 설정 객체
   */
  parseExcelSettingsFromXML(parsed) {
    const excelSettings = {
      separateToc: false,
      maxRows: null,
      style: null,
      db: null,
      output: null
    };

    // queries 루트 엘리먼트에서 separateToc 속성 확인
    if (parsed.queries && parsed.queries.$) {
      if (parsed.queries.$.separateToc) {
        excelSettings.separateToc = parsed.queries.$.separateToc === 'true';
      }
    }
    
    if (parsed.queries && parsed.queries.excel && parsed.queries.excel[0]) {
      const excel = parsed.queries.excel[0];
      if (excel.$ && excel.$.db) excelSettings.db = excel.$.db;
      if (excel.$ && excel.$.output) excelSettings.output = excel.$.output;
      // excel 엘리먼트의 separateToc가 있으면 우선적용 (덮어쓰기)
      if (excel.$ && excel.$.separateToc) excelSettings.separateToc = excel.$.separateToc === 'true';
      // excel 엘리먼트의 maxRows 읽기
      if (excel.$ && excel.$.maxRows) excelSettings.maxRows = parseInt(excel.$.maxRows);
      // XML에서 스타일 템플릿 ID 읽기
      if (excel.$ && excel.$.style) excelSettings.style = excel.$.style;
    }

    return excelSettings;
  }

  /**
   * JSON에서 엑셀 설정 파싱
   * @param {Object} queries - 파싱된 JSON 객체
   * @returns {Object} 엑셀 설정 객체
   */
  parseExcelSettingsFromJSON(queries) {
    const excelSettings = {
      separateToc: false,
      maxRows: null,
      style: null,
      db: null,
      output: null
    };

    if (queries.excel) {
      if (queries.excel.db) excelSettings.db = queries.excel.db;
      if (queries.excel.output) excelSettings.output = queries.excel.output;
      if (queries.excel.separateToc !== undefined) excelSettings.separateToc = queries.excel.separateToc;
      if (queries.excel.maxRows !== undefined) excelSettings.maxRows = parseInt(queries.excel.maxRows);
      if (queries.excel.style) excelSettings.style = queries.excel.style;
    }

    return excelSettings;
  }

  /**
   * CLI 변수 파싱
   * @param {Array} cliVars - CLI 변수 배열
   * @returns {Object} 파싱된 변수 객체
   */
  parseCLIVariables(cliVars) {
    const vars = {};
    for (const v of cliVars) {
      const [key, value] = v.split('=');
      vars[key] = value;
    }
    return vars;
  }

  /**
   * 쿼리 파일 존재 여부 확인
   * @param {string} filePath - 파일 경로
   * @returns {boolean} 존재 여부
   */
  queryFileExists(filePath) {
    return FileUtils.exists(filePath);
  }

  /**
   * 쿼리 파일 확장자 확인
   * @param {string} filePath - 파일 경로
   * @returns {string} 확장자
   */
  getQueryFileExtension(filePath) {
    return FileUtils.getExtension(filePath);
  }

  /**
   * 쿼리 파일 검증
   * @param {string} filePath - 파일 경로
   * @returns {boolean} 유효성 여부
   */
  validateQueryFile(filePath) {
    return FileUtils.validateFilename(filePath);
  }
}

module.exports = QueryParser;
