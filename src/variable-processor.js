const MSSQLHelper = require('./mssql-helper');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        dynamicVarSet: 'Dynamic variable set:',
        dynamicVarProcessStart: '\n🔄 Dynamic variable processing started',
        dynamicVarProcessing: '\n📊 Processing dynamic variable:',
        noDesc: 'no description',
        database: '   Database:',
        dynamicVarSpecified: 'dynamic variable specified',
        default: 'default',
        keyValuePairs: '   ✅',
        keyValuePairsText: 'key-value pairs',
        keyValuePairsNeedMin2Cols: '   ⚠️',
        keyValuePairsNeedMin2ColsText: 'key_value_pairs type requires at least 2 columns',
        columnsRows: '   ✅',
        columnsText: 'columns,',
        rowsText: 'rows',
        noResults: '   ⚠️',
        noResultsText: 'No query results',
        processError: '   ❌',
        processErrorText: 'Error during processing:',
        dynamicVarProcessComplete: '\n✅ Dynamic variable processing completed',
        variableSubstStart: 'Variable substitution started:',
        dynamicVarSub: 'Dynamic variable',
        substituted: 'substituted:',
        array: 'array',
        toInClause: '→ IN clause',
        objectType: 'object type',
        errorDuring: 'Error during',
        substitution: 'substitution:',
        timestampFunc: 'Timestamp function',
        generalVar: 'General variable',
        envVar: 'Environment variable',
        simpleString: '(simple string)',
        skipped: 'skipped: already processed variable',
        unresolvedVars: 'Unresolved variables:',
        unresolvedDynamicVar: 'Unresolved dynamic variable',
        replacedWith: '→ replaced with',
        unresolvedVar: 'Unresolved variable',
        emptyString: '→ replaced with empty string'
    },
    kr: {
        dynamicVarSet: '동적 변수 설정:',
        dynamicVarProcessStart: '\n🔄 동적 변수 처리 시작',
        dynamicVarProcessing: '\n📊 동적 변수 처리 중:',
        noDesc: '설명 없음',
        database: '   데이터베이스:',
        dynamicVarSpecified: '동적변수 지정',
        default: '기본값',
        keyValuePairs: '   ✅',
        keyValuePairsText: '개 키-값 쌍',
        keyValuePairsNeedMin2Cols: '   ⚠️',
        keyValuePairsNeedMin2ColsText: 'key_value_pairs 타입은 최소 2개 컬럼이 필요합니다',
        columnsRows: '   ✅',
        columnsText: '개 컬럼,',
        rowsText: '개 행',
        noResults: '   ⚠️',
        noResultsText: '조회 결과가 없습니다',
        processError: '   ❌',
        processErrorText: '처리 중 오류:',
        dynamicVarProcessComplete: '\n✅ 동적 변수 처리 완료',
        variableSubstStart: '변수 치환 시작:',
        dynamicVarSub: '동적 변수',
        substituted: '치환:',
        array: '배열',
        toInClause: '→ IN절',
        objectType: '객체 타입',
        errorDuring: '중 오류:',
        substitution: '치환',
        timestampFunc: '시각 함수',
        generalVar: '일반 변수',
        envVar: '환경 변수',
        simpleString: '(단순 문자열)',
        skipped: '건너뜀: 이미 처리된 변수',
        unresolvedVars: '치환되지 않은 변수들:',
        unresolvedDynamicVar: '치환되지 않은 동적 변수',
        replacedWith: '→',
        emptyString: '로 대체',
        unresolvedVar: '치환되지 않은 변수'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 변수 처리 관련 함수들을 담당하는 모듈
 */
class VariableProcessor {
  constructor() {
    this.dynamicVariables = {};
    this.mssqlHelper = new MSSQLHelper(LANGUAGE);
    this.msg = msg;
  }

  /**
   * 동적 변수 설정
   * @param {string} key - 변수 키
   * @param {any} value - 변수 값
   */
  setDynamicVariable(key, value) {
    this.dynamicVariables[key] = value;
    console.log(`${this.msg.dynamicVarSet} ${key} = ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`);
  }

  /**
   * 동적 변수 처리
   * @param {Array} dynamicVars - 동적 변수 정의 배열
   * @param {MSSQLHelper} mssqlHelper - MSSQL 헬퍼 인스턴스
   * @param {string} dbKey - 데이터베이스 키
   * @param {Object} globalVars - 전역 변수
   * @param {Object} configObj - 데이터베이스 설정 객체
   */
  async processDynamicVariables(dynamicVars, mssqlHelper, dbKey, globalVars, configObj) {
    // 동적 변수 초기화
    this.dynamicVariables = {};
    
    if (dynamicVars && Array.isArray(dynamicVars) && dynamicVars.length > 0) {
      console.log(`${this.msg.dynamicVarProcessStart} (${dynamicVars.length}개)`);
      
      for (const dynamicVar of dynamicVars) {
        if (dynamicVar.name && dynamicVar.query) {
          try {
            console.log(`${this.msg.dynamicVarProcessing} ${dynamicVar.name} (${dynamicVar.description || this.msg.noDesc})`);
            
            // 쿼리에서 변수 치환 (기존 변수들로)
            const processedQuery = this.substituteVars(dynamicVar.query, globalVars);
            
            // 동적 변수에 지정된 데이터베이스 사용 (있으면), 없으면 기본값 사용
            const targetDbKey = dynamicVar.database || dbKey;
            console.log(`${this.msg.database} ${targetDbKey} (${dynamicVar.database ? this.msg.dynamicVarSpecified : this.msg.default})`);
            
            // DB에서 데이터 조회
            const pool = await mssqlHelper.createConnectionPool(configObj[targetDbKey], targetDbKey);
            const result = await mssqlHelper.executeQuery(pool, processedQuery);
            
            if (result.recordset && result.recordset.length > 0) {
              const data = result.recordset;
              
              if (dynamicVar.type === 'key_value_pairs') {
                // key_value_pairs 타입: 첫 번째 컬럼을 키로, 두 번째 컬럼을 값으로
                const keyValueData = {};
                const columns = Object.keys(data[0]);
                
                if (columns.length >= 2) {
                  const keyColumn = columns[0];
                  const valueColumn = columns[1];
                  
                  // 키 값들을 배열로 저장 (IN절용)
                  const keyValues = data.map(row => row[keyColumn]).filter(val => val !== null && val !== undefined);
                  keyValueData[keyColumn] = keyValues;
                  
                  // 값들도 저장
                  const values = data.map(row => row[valueColumn]).filter(val => val !== null && val !== undefined);
                  keyValueData[valueColumn] = values;
                  
                  // 키-값 쌍도 저장
                  data.forEach(row => {
                    const key = row[keyColumn];
                    const value = row[valueColumn];
                    if (key !== null && key !== undefined) {
                      keyValueData[key] = value;
                    }
                  });
                  
                  this.setDynamicVariable(dynamicVar.name, keyValueData);
                  console.log(`${this.msg.keyValuePairs} ${dynamicVar.name}: ${Object.keys(keyValueData).length}${this.msg.keyValuePairsText}`);
                } else {
                  console.warn(`${this.msg.keyValuePairsNeedMin2Cols} ${dynamicVar.name}: ${this.msg.keyValuePairsNeedMin2ColsText}`);
                }
                
              } else {
                // 기본 타입 (column_identified): 각 컬럼별로 배열 생성
                const columnData = {};
                const columns = Object.keys(data[0]);
                
                columns.forEach(column => {
                  columnData[column] = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
                });
                
                this.setDynamicVariable(dynamicVar.name, columnData);
                console.log(`${this.msg.columnsRows} ${dynamicVar.name}: ${columns.length}${this.msg.columnsText} ${data.length}${this.msg.rowsText}`);
              }
            } else {
              console.warn(`${this.msg.noResults} ${dynamicVar.name}: ${this.msg.noResultsText}`);
              this.setDynamicVariable(dynamicVar.name, []);
            }
            
          } catch (error) {
            console.error(`${this.msg.processError} ${dynamicVar.name} ${this.msg.processErrorText} ${error.message}`);
            this.setDynamicVariable(dynamicVar.name, []);
          }
        }
      }
      
      console.log(this.msg.dynamicVarProcessComplete);
    }
  }

  /**
   * 향상된 변수 치환 함수 (동적 변수 지원)
   * @param {string} str - 치환할 문자열
   * @param {Object} vars - 변수 객체
   * @param {Object} sheetParams - 시트별 파라미터 (선택사항)
   * @returns {string} 치환된 문자열
   */
  substituteVars(str, vars, sheetParams = {}) {
    let result = str;
    const debugVariables = process.env.DEBUG_VARIABLES === 'true';
    
    if (debugVariables) {
      console.log(`${this.msg.variableSubstStart} ${str.substring(0, 200)}${str.length > 200 ? '...' : ''}`);
    }
    
    // 시트별 파라미터를 전역 변수에 병합 (우선순위 높음)
    const mergedVars = { ...vars, ...sheetParams };
    
    // 동적 변수 치환 (우선순위 높음)
    Object.entries(this.dynamicVariables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      const beforeReplace = result;
      
      try {
        // 배열 타입인 경우 IN절 처리
        if (Array.isArray(value)) {
          const inClause = this.mssqlHelper.createInClause(value);
          result = result.replace(pattern, inClause);
          
          if (debugVariables && beforeReplace !== result) {
            console.log(`${this.msg.dynamicVarSub} [${key}] ${this.msg.substituted} ${this.msg.array} ${value.length}개 ${this.msg.toInClause}`);
          }
        } 
        // 객체 타입인 경우 (column_identified 또는 key_value_pairs)
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // ${변수명.키} 패턴 처리
          Object.keys(value).forEach(keyName => {
            const keyPattern = new RegExp(`\\$\\{${key}\\.${keyName}\\}`, 'g');
            const keyValue = value[keyName];
            const beforeKeyReplace = result;
            
            if (Array.isArray(keyValue)) {
              // column_identified: 배열 값을 IN절로 변환
              const inClause = this.mssqlHelper.createInClause(keyValue);
              result = result.replace(keyPattern, inClause);
            } else {
              // key_value_pairs: 키 값들을 배열로 반환 (IN절용)
              if (Array.isArray(keyValue)) {
                const inClause = this.mssqlHelper.createInClause(keyValue);
                result = result.replace(keyPattern, inClause);
              } else {
                // 단일 값인 경우
                const replacementValue = typeof keyValue === 'string' ? `'${keyValue.replace(/'/g, "''")}'` : keyValue;
                result = result.replace(keyPattern, replacementValue);
              }
            }
            
            if (debugVariables && beforeKeyReplace !== result) {
              console.log(`${this.msg.dynamicVarSub} [${key}.${keyName}] ${this.msg.substituted} ${Array.isArray(keyValue) ? `${this.msg.array} ${keyValue.length}개` : keyValue}`);
            }
          });
          
          // ${변수명} 패턴 처리
          const allValues = Object.values(value);
          if (allValues.every(v => Array.isArray(v))) {
            // column_identified: 모든 배열 값을 통합하여 IN절로
            const flatValues = allValues.flat();
            const inClause = this.mssqlHelper.createInClause(flatValues);
            result = result.replace(pattern, inClause);
          } else {
            // key_value_pairs: 모든 값들을 IN절로
            const inClause = this.mssqlHelper.createInClause(allValues);
            result = result.replace(pattern, inClause);
          }
          
          if (debugVariables && beforeReplace !== result) {
            console.log(`${this.msg.dynamicVarSub} [${key}] ${this.msg.substituted} ${this.msg.objectType}`);
          }
        } 
        else {
          result = result.replace(pattern, value);
          
          if (debugVariables && beforeReplace !== result) {
            console.log(`${this.msg.dynamicVarSub} [${key}] ${this.msg.substituted} ${value}`);
          }
        }
      } catch (error) {
        console.log(`${this.msg.dynamicVarSub} [${key}] ${this.msg.substitution} ${this.msg.errorDuring} ${error.message}`);
        // 오류 발생 시 원본 유지
      }
    });
    
    // 현재 시각 함수 치환 (MSSQL 헬퍼 사용) - 일반 변수보다 먼저 처리
    const timestampFunctions = this.mssqlHelper.getTimestampFunctions();
    
    // 현재 시각 함수 패턴 매칭 및 치환
    Object.entries(timestampFunctions).forEach(([funcName, funcImpl]) => {
      const pattern = new RegExp(`\\$\\{${funcName}\\}`, 'g');
      const beforeReplace = result;
      
      try {
        result = result.replace(pattern, funcImpl());
        
        if (debugVariables && beforeReplace !== result) {
          console.log(`${this.msg.timestampFunc} [${funcName}] ${this.msg.substituted} ${funcImpl()}`);
        }
      } catch (error) {
        console.log(`${this.msg.timestampFunc} [${funcName}] ${this.msg.substitution} ${this.msg.errorDuring} ${error.message}`);
        // 오류 발생 시 원본 유지
      }
    });
    
    // 일반 변수 치환 (기존 방식) - 시각 함수 치환 후 처리
    result = result.replace(/\$\{(\w+)\}/g, (_, v) => {
      const value = mergedVars[v];
      if (value === undefined || value === null) return '';
      
      // 배열 타입인 경우 IN절 처리
      if (Array.isArray(value)) {
        const inClause = this.mssqlHelper.createInClause(value);
        
        if (debugVariables) {
          console.log(`${this.msg.generalVar} [${v}] ${this.msg.substituted} ${this.msg.array} ${value.length}개 ${this.msg.toInClause}`);
        }
        return inClause;
      } else {
        // 기존 방식: 단일 값 치환
        if (debugVariables) {
          console.log(`${this.msg.generalVar} [${v}] ${this.msg.substituted} ${value}`);
        }
        return value;
      }
    });
    
    // 환경 변수 치환
    const envPattern = /\$\{(\w+)\}/g;
    const remainingMatches = [...result.matchAll(envPattern)];
    
    remainingMatches.forEach(match => {
      const fullMatch = match[0];
      const varName = match[1];
      
      // 이미 처리된 변수들과 중복되지 않는 경우만 환경 변수로 치환
      const isAlreadyProcessed = 
        this.dynamicVariables.hasOwnProperty(varName) ||
        vars.hasOwnProperty(varName) ||
        timestampFunctions.hasOwnProperty(varName);
        
      if (!isAlreadyProcessed && process.env[varName]) {
        const envValue = process.env[varName];
        
        try {
          // 환경 변수가 배열 형태인지 확인 (JSON 형태로 저장된 경우)
          const parsed = JSON.parse(envValue);
          if (Array.isArray(parsed)) {
            const inClause = this.mssqlHelper.createInClause(parsed);
            result = result.replace(fullMatch, inClause);
            
            if (debugVariables) {
              console.log(`${this.msg.envVar} [${varName}] ${this.msg.substituted} ${this.msg.array} ${parsed.length}개 ${this.msg.toInClause}`);
            }
          } else {
            result = result.replace(fullMatch, envValue);
            
            if (debugVariables) {
              console.log(`${this.msg.envVar} [${varName}] ${this.msg.substituted} ${envValue}`);
            }
          }
        } catch (e) {
          // JSON 파싱 실패 시 원본 값 사용
          result = result.replace(fullMatch, envValue);
          
          if (debugVariables) {
            console.log(`${this.msg.envVar} [${varName}] ${this.msg.substituted} ${envValue} ${this.msg.simpleString}`);
          }
        }
      } else if (debugVariables && process.env[varName]) {
        console.log(`${this.msg.envVar} [${varName}] ${this.msg.skipped}`);
      }
    });
    
    // 치환되지 않은 변수 확인 및 처리
    const unresolvedVariables = [...result.matchAll(/\$\{(\w+(?:\.\w+)?)\}/g)];
    if (unresolvedVariables.length > 0) {
      if (debugVariables) {
        console.log(`${this.msg.unresolvedVars} ${unresolvedVariables.map(m => m[1]).join(', ')}`);
      }
      
      // 치환되지 않은 변수를 빈 문자열로 대체하여 SQL 오류 방지
      unresolvedVariables.forEach(match => {
        const fullMatch = match[0];
        const varName = match[1];
        
        // 동적 변수의 경우 빈 배열로 대체
        if (this.dynamicVariables.hasOwnProperty(varName.split('.')[0])) {
          result = result.replace(fullMatch, "'^-_'");
          if (debugVariables) {
            console.log(`${this.msg.unresolvedDynamicVar} [${varName}] ${this.msg.replacedWith} '^-_'${this.msg.emptyString}`);
          }
        } else {
          // 일반 변수의 경우 빈 문자열로 대체
          result = result.replace(fullMatch, "''");
          if (debugVariables) {
            console.log(`${this.msg.unresolvedVar} [${varName}] ${this.msg.replacedWith} ''${this.msg.emptyString}`);
          }
        }
      });
    }
    
    return result;
  }

  /**
   * 동적 변수 가져오기
   * @returns {Object} 동적 변수 객체
   */
  getDynamicVariables() {
    return this.dynamicVariables;
  }

  /**
   * 동적 변수 초기화
   */
  clearDynamicVariables() {
    this.dynamicVariables = {};
  }
}

module.exports = VariableProcessor;
