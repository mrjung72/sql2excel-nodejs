const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const ExcelJS = require('exceljs');
const yargs = require('yargs');
const JSON5 = require('json5');
const xml2js = require('xml2js');
const excelStyleHelper = require('./excel-style-helper');

// 동적 변수 저장소
let dynamicVariables = {};

// 파일명에 한글이 포함되어 있는지 확인하는 함수
function hasKoreanInFilename(filepath) {
  const filename = path.basename(filepath);
  const koreanRegex = /[가-힣]/;
  return koreanRegex.test(filename);
}

// 파일명 검증 및 경고 함수
function validateFilename(filepath) {
  if (hasKoreanInFilename(filepath)) {
    console.warn(`⚠️  경고: 파일명에 한글이 포함되어 있습니다: ${path.basename(filepath)}`);
    console.warn(`   💡 권장사항: 파일명을 영문으로 변경하세요.`);
    console.warn(`   💡 예시: "${path.basename(filepath)}" → "${path.basename(filepath).replace(/[가-힣]/g, '')}"`);
    return false;
  }
  return true;
}

// 동적 변수 설정 함수
function setDynamicVariable(key, value) {
  dynamicVariables[key] = value;
  console.log(`동적 변수 설정: ${key} = ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`);
}

// 동적 변수 처리 함수
async function processDynamicVariables(dynamicVars, dbPool, globalVars) {
  // 동적 변수 초기화
  dynamicVariables = {};
  
  if (dynamicVars && Array.isArray(dynamicVars) && dynamicVars.length > 0) {
    console.log(`\n🔄 동적 변수 처리 시작 (${dynamicVars.length}개)`);
    
    for (const dynamicVar of dynamicVars) {
      if (dynamicVar.name && dynamicVar.query) {
        try {
          console.log(`\n📊 동적 변수 처리 중: ${dynamicVar.name} (${dynamicVar.description || '설명 없음'})`);
          
          // 쿼리에서 변수 치환 (기존 변수들로)
          const processedQuery = substituteVars(dynamicVar.query, globalVars);
          
          // DB에서 데이터 조회
          const result = await dbPool.request().query(processedQuery);
          
          if (result.recordset && result.recordset.length > 0) {
            const data = result.recordset;
            
            if (dynamicVar.type === 'column_identified') {
              // column_identified 타입: 각 컬럼별로 배열 생성
              const columnData = {};
              const columns = Object.keys(data[0]);
              
              columns.forEach(column => {
                columnData[column] = data.map(row => row[column]).filter(val => val !== null && val !== undefined);
              });
              
              setDynamicVariable(dynamicVar.name, columnData);
              console.log(`   ✅ ${dynamicVar.name}: ${columns.length}개 컬럼, ${data.length}개 행`);
              
            } else if (dynamicVar.type === 'key_value_pairs') {
              // key_value_pairs 타입: 첫 번째 컬럼을 키로, 두 번째 컬럼을 값으로
              const keyValueData = {};
              const columns = Object.keys(data[0]);
              
              if (columns.length >= 2) {
                const keyColumn = columns[0];
                const valueColumn = columns[1];
                
                data.forEach(row => {
                  const key = row[keyColumn];
                  const value = row[valueColumn];
                  if (key !== null && key !== undefined) {
                    keyValueData[key] = value;
                  }
                });
                
                setDynamicVariable(dynamicVar.name, keyValueData);
                console.log(`   ✅ ${dynamicVar.name}: ${Object.keys(keyValueData).length}개 키-값 쌍`);
              } else {
                console.warn(`   ⚠️ ${dynamicVar.name}: key_value_pairs 타입은 최소 2개 컬럼이 필요합니다`);
              }
              
            } else {
              // 기본 타입: 첫 번째 컬럼의 값들을 배열로
              const firstColumn = Object.keys(data[0])[0];
              const values = data.map(row => row[firstColumn]).filter(val => val !== null && val !== undefined);
              
              setDynamicVariable(dynamicVar.name, values);
              console.log(`   ✅ ${dynamicVar.name}: ${values.length}개 값 (${firstColumn} 컬럼)`);
            }
          } else {
            console.warn(`   ⚠️ ${dynamicVar.name}: 조회 결과가 없습니다`);
            setDynamicVariable(dynamicVar.name, []);
          }
          
        } catch (error) {
          console.error(`   ❌ ${dynamicVar.name} 처리 중 오류: ${error.message}`);
          setDynamicVariable(dynamicVar.name, []);
        }
      }
    }
    
    console.log(`\n✅ 동적 변수 처리 완료`);
  }
}

// 엑셀 스타일 템플릿 로더
let styleTemplates = null;

async function loadStyleTemplates() {
  if (styleTemplates) return styleTemplates;
  
  const templatePath = path.join(__dirname, '..', 'templates', 'excel-styles.xml');
  
  try {
    const xml = fs.readFileSync(templatePath, 'utf8');
    const parsed = await xml2js.parseStringPromise(xml, { trim: true });
    
    styleTemplates = {};
    if (parsed.excelStyles && parsed.excelStyles.style) {
      for (const style of parsed.excelStyles.style) {
        if (style.$ && style.$.id) {
          const styleId = style.$.id;
          const styleName = style.$.name || styleId;
          const description = style.$.description || '';
          
          styleTemplates[styleId] = {
            id: styleId,
            name: styleName,
            description: description,
            header: parseStyleSection(style.header && style.header[0]),
            body: parseStyleSection(style.body && style.body[0])
          };
        }
      }
    }
    
    console.log(`📋 로드된 스타일 템플릿: ${Object.keys(styleTemplates).length}개`);
    return styleTemplates;
  } catch (error) {
    console.warn(`⚠️  스타일 템플릿 로드 실패: ${templatePath}`);
    console.warn(`   오류: ${error.message}`);
    console.warn(`   💡 기본 스타일을 사용합니다.`);
    return {};
  }
}

// 스타일 섹션 파싱
function parseStyleSection(section) {
  if (!section) return {};
  
  const result = {};
  
  if (section.font && section.font[0] && section.font[0].$) {
    result.font = section.font[0].$;
  }
  if (section.fill && section.fill[0] && section.fill[0].$) {
    result.fill = section.fill[0].$;
  }
  if (section.colwidths && section.colwidths[0] && section.colwidths[0].$) {
    result.colwidths = section.colwidths[0].$;
  }
  if (section.alignment && section.alignment[0] && section.alignment[0].$) {
    result.alignment = section.alignment[0].$;
  }
  if (section.border && section.border[0]) {
    result.border = parseXmlBorder(section.border[0]);
  }
  
  return result;
}

// 스타일 ID로 스타일 가져오기
async function getStyleById(styleId) {
  const templates = await loadStyleTemplates();
  return templates[styleId] || templates['default'] || null;
}

// 사용 가능한 스타일 목록 출력
async function listAvailableStyles() {
  const templates = await loadStyleTemplates();
  
  console.log('\n📋 사용 가능한 엑셀 스타일 템플릿:');
  console.log('─'.repeat(60));
  
  for (const [id, style] of Object.entries(templates)) {
    console.log(`  ${id.padEnd(12)} | ${style.name.padEnd(15)} | ${style.description}`);
  }
  console.log('─'.repeat(60));
}

// 향상된 변수 치환 함수 (동적 변수 지원)
function substituteVars(str, vars) {
  let result = str;
  const debugVariables = process.env.DEBUG_VARIABLES === 'true';
  
  if (debugVariables) {
    console.log(`변수 치환 시작: ${str.substring(0, 200)}${str.length > 200 ? '...' : ''}`);
  }
  
  // 동적 변수 치환 (우선순위 높음)
  Object.entries(dynamicVariables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    const beforeReplace = result;
    
    try {
      // 배열 타입인 경우 IN절 처리
      if (Array.isArray(value)) {
        if (value.length === 0) {
          // 빈 배열을 존재하지 않을 것 같은 값으로 치환
          result = result.replace(pattern, "'^-_'");
        } else {
          const inClause = value.map(v => {
            if (typeof v === 'string') {
              return `'${v.replace(/'/g, "''")}'`;
            }
            return v;
          }).join(', ');
          result = result.replace(pattern, inClause);
        }
        
        if (debugVariables && beforeReplace !== result) {
          console.log(`동적 변수 [${key}] 치환: 배열 ${value.length}개 → IN절`);
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
            const inClause = keyValue.map(v => {
              if (typeof v === 'string') {
                return `'${v.replace(/'/g, "''")}'`;
              }
              return v;
            }).join(', ');
            result = result.replace(keyPattern, inClause);
          } else {
            // key_value_pairs: 단일 값을 그대로 치환
            const replacementValue = typeof keyValue === 'string' ? `'${keyValue.replace(/'/g, "''")}'` : keyValue;
            result = result.replace(keyPattern, replacementValue);
          }
          
          if (debugVariables && beforeKeyReplace !== result) {
            console.log(`동적 변수 [${key}.${keyName}] 치환: ${Array.isArray(keyValue) ? `배열 ${keyValue.length}개` : keyValue}`);
          }
        });
        
        // ${변수명} 패턴 처리
        const allValues = Object.values(value);
        if (allValues.every(v => Array.isArray(v))) {
          // column_identified: 모든 배열 값을 통합하여 IN절로
          const flatValues = allValues.flat();
          const inClause = flatValues.map(v => {
            if (typeof v === 'string') {
              return `'${v.replace(/'/g, "''")}'`;
            }
            return v;
          }).join(', ');
          result = result.replace(pattern, inClause);
        } else {
          // key_value_pairs: 모든 값들을 IN절로
          const inClause = allValues.map(v => {
            if (typeof v === 'string') {
              return `'${v.replace(/'/g, "''")}'`;
            }
            return v;
          }).join(', ');
          result = result.replace(pattern, inClause);
        }
        
        if (debugVariables && beforeReplace !== result) {
          console.log(`동적 변수 [${key}] 치환: 객체 타입`);
        }
      } 
      else {
        result = result.replace(pattern, value);
        
        if (debugVariables && beforeReplace !== result) {
          console.log(`동적 변수 [${key}] 치환: ${value}`);
        }
      }
    } catch (error) {
      console.log(`동적 변수 [${key}] 치환 중 오류: ${error.message}`);
      // 오류 발생 시 원본 유지
    }
  });
  
  // 일반 변수 치환 (기존 방식)
  result = result.replace(/\$\{(\w+)\}/g, (_, v) => {
    const value = vars[v];
    if (value === undefined || value === null) return '';
    
    // 배열 타입인 경우 IN절 처리
    if (Array.isArray(value)) {
      // 문자열 배열인 경우 따옴표로 감싸기
      const inClause = value.map(val => {
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`; // SQL 인젝션 방지를 위한 따옴표 이스케이핑
        }
        return val;
      }).join(', ');
      
      if (debugVariables) {
        console.log(`일반 변수 [${v}] 치환: 배열 ${value.length}개 → IN절`);
      }
      return inClause;
    } else {
      // 기존 방식: 단일 값 치환
      if (debugVariables) {
        console.log(`일반 변수 [${v}] 치환: ${value}`);
      }
      return value;
    }
  });
  
  // 현재 시각 함수 치환
  const timestampFunctions = {
    'CURRENT_TIMESTAMP': () => new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
    'CURRENT_DATETIME': () => new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
    'NOW': () => new Date().toISOString().slice(0, 19).replace('T', ' '), // YYYY-MM-DD HH:mm:ss
    'CURRENT_DATE': () => new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    'CURRENT_TIME': () => new Date().toTimeString().slice(0, 8), // HH:mm:ss
    'UNIX_TIMESTAMP': () => Math.floor(Date.now() / 1000), // Unix timestamp
    'TIMESTAMP_MS': () => Date.now(), // Milliseconds timestamp
    'ISO_TIMESTAMP': () => new Date().toISOString(), // ISO 8601 format
    'GETDATE': () => new Date().toISOString().slice(0, 19).replace('T', ' ') // SQL Server GETDATE() equivalent
  };
  
  // 현재 시각 함수 패턴 매칭 및 치환
  Object.entries(timestampFunctions).forEach(([funcName, funcImpl]) => {
    const pattern = new RegExp(`\\$\\{${funcName}\\}`, 'g');
    const beforeReplace = result;
    
    try {
      result = result.replace(pattern, funcImpl());
      
      if (debugVariables && beforeReplace !== result) {
        console.log(`시각 함수 [${funcName}] 치환: ${funcImpl()}`);
      }
    } catch (error) {
      console.log(`시각 함수 [${funcName}] 치환 중 오류: ${error.message}`);
      // 오류 발생 시 원본 유지
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
      dynamicVariables.hasOwnProperty(varName) ||
      vars.hasOwnProperty(varName) ||
      timestampFunctions.hasOwnProperty(varName);
      
    if (!isAlreadyProcessed && process.env[varName]) {
      const envValue = process.env[varName];
      
      try {
        // 환경 변수가 배열 형태인지 확인 (JSON 형태로 저장된 경우)
        const parsed = JSON.parse(envValue);
        if (Array.isArray(parsed)) {
          const inClause = parsed.map(v => {
            if (typeof v === 'string') {
              return `'${v.replace(/'/g, "''")}'`;
            }
            return v;
          }).join(', ');
          result = result.replace(fullMatch, inClause);
          
          if (debugVariables) {
            console.log(`환경 변수 [${varName}] 치환: 배열 ${parsed.length}개 → IN절`);
          }
        } else {
          result = result.replace(fullMatch, envValue);
          
          if (debugVariables) {
            console.log(`환경 변수 [${varName}] 치환: ${envValue}`);
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 값 사용
        result = result.replace(fullMatch, envValue);
        
        if (debugVariables) {
          console.log(`환경 변수 [${varName}] 치환: ${envValue} (단순 문자열)`);
        }
      }
    } else if (debugVariables && process.env[varName]) {
      console.log(`환경 변수 [${varName}] 건너뜀: 이미 처리된 변수`);
    }
  });
  
  // 치환되지 않은 변수 확인 및 처리
  const unresolvedVariables = [...result.matchAll(/\$\{(\w+(?:\.\w+)?)\}/g)];
  if (unresolvedVariables.length > 0) {
    if (debugVariables) {
      console.log(`치환되지 않은 변수들: ${unresolvedVariables.map(m => m[1]).join(', ')}`);
    }
    
    // 치환되지 않은 변수를 빈 문자열로 대체하여 SQL 오류 방지
    unresolvedVariables.forEach(match => {
      const fullMatch = match[0];
      const varName = match[1];
      
      // 동적 변수의 경우 빈 배열로 대체
      if (dynamicVariables.hasOwnProperty(varName.split('.')[0])) {
        result = result.replace(fullMatch, "'^-_'");
        if (debugVariables) {
          console.log(`치환되지 않은 동적 변수 [${varName}] → '^-_'로 대체`);
        }
      } else {
        // 일반 변수의 경우 빈 문자열로 대체
        result = result.replace(fullMatch, "''");
        if (debugVariables) {
          console.log(`치환되지 않은 변수 [${varName}] → 빈 문자열로 대체`);
        }
      }
    });
  }
  
  return result;
}

async function loadQueriesFromXML(xmlPath) {
  // 파일명 인코딩 문제 해결을 위한 안전한 파일 읽기
  let xml;
  try {
    xml = fs.readFileSync(xmlPath, 'utf8');
  } catch (error) {
    // 파일명 인코딩 문제일 가능성이 높음
    console.warn(`⚠️  파일 읽기 실패: ${xmlPath}`);
    console.warn(`   오류: ${error.message}`);
    console.warn(`   💡 해결방법: 파일명에 한글이 포함되어 있다면 영문으로 변경해주세요.`);
    console.warn(`   💡 예시: "queries-sample - 복사본.xml" → "queries-sample-copy.xml"`);
    throw new Error(`파일을 읽을 수 없습니다: ${xmlPath}\n파일명에 한글이 포함되어 있으면 영문으로 변경해주세요.`);
  }
  const parsed = await xml2js.parseStringPromise(xml, { trim: true });
  if (!parsed.queries || !parsed.queries.sheet) throw new Error('Invalid XML format');
  
  // 쿼리 정의 파싱
  let queryDefs = {};
  if (parsed.queries.queryDefs && parsed.queries.queryDefs[0] && parsed.queries.queryDefs[0].queryDef) {
    for (const queryDef of parsed.queries.queryDefs[0].queryDef) {
      if (queryDef.$ && queryDef.$.name) {
        const queryName = queryDef.$.name;
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
        
        dynamicVars.push({
          name: dv.$.name,
          query: query,
          type: type,
          description: description
        });
        
        console.log(`동적 변수 정의 발견: ${dv.$.name} (타입: ${type}, 설명: ${description})`);
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
    
    // queryRef 속성이 있으면 쿼리 정의에서 참조
    if (s.$.queryRef) {
      const queryRef = s.$.queryRef;
      if (queryDefs[queryRef]) {
        query = queryDefs[queryRef].query;
        console.log(`[쿼리 참조] 시트 "${s.$.name}"이(가) 쿼리 정의 "${queryRef}"을(를) 참조합니다.`);
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
      query: query
    };
  });
  
  return { globalVars, sheets, dbId, outputPath, queryDefs, dynamicVars };
}

function resolvePath(p) {
  if (!p) return '';
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

function printAvailableXmlFiles() {
  const dir = path.join(process.cwd(), 'queries');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml'));
  if (files.length > 0) {
    console.log('-------------------------------------------------------------------------------');
    console.log('[INFO] 사용 가능한 XML 쿼리 정의 파일 목록:');
    console.log('-------------------------------------------------------------------------------');
    files.forEach(f => console.log('  - queries/' + f));
    console.log('-------------------------------------------------------------------------------');

  } else {
    console.log('[INFO] queries 폴더에 XML 쿼리 정의 파일이 없습니다.');
  }
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getNowTimestampStr() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function parseColWidths(colwidths, colCount) {
  // colwidths: {min, max} or undefined
  // colCount: 실제 컬럼 개수
  return function(lengths) {
    // lengths: 각 컬럼별 최대 문자열 길이 배열
    let min = 10, max = 30;
    if (colwidths && typeof colwidths === 'object') {
      if (colwidths.min) min = Number(colwidths.min);
      if (colwidths.max) max = Number(colwidths.max);
    }
    return lengths.map(len => Math.max(min, Math.min(max, len)));
  };
}

// parseBorder 함수는 excel-style-helper.js로 이동됨

/**
 * XML 형식의 border 요소를 JSON 형식으로 변환
 * @param {Object} xmlBorder - XML에서 파싱된 border 객체
 * @returns {Object} JSON 형식의 border 객체
 */
function parseXmlBorder(xmlBorder) {
  const result = {};
  
  // <border><all style="thin" color="000000"/></border> 형식 처리
  if (xmlBorder.all && xmlBorder.all[0] && xmlBorder.all[0].$) {
    result.all = xmlBorder.all[0].$;
  }
  
  // 개별 방향별 테두리 처리
  if (xmlBorder.top && xmlBorder.top[0] && xmlBorder.top[0].$) {
    result.top = xmlBorder.top[0].$;
  }
  if (xmlBorder.left && xmlBorder.left[0] && xmlBorder.left[0].$) {
    result.left = xmlBorder.left[0].$;
  }
  if (xmlBorder.right && xmlBorder.right[0] && xmlBorder.right[0].$) {
    result.right = xmlBorder.right[0].$;
  }
  if (xmlBorder.bottom && xmlBorder.bottom[0] && xmlBorder.bottom[0].$) {
    result.bottom = xmlBorder.bottom[0].$;
  }
  
  return result;
}

function isSheetEnabled(sheetDef) {
  let use = true;
  // JSON: use 속성
  if (typeof sheetDef.use !== 'undefined') {
    if (
      sheetDef.use === false ||
      sheetDef.use === 0 ||
      sheetDef.use === 'false' ||
      sheetDef.use === '0' ||
      sheetDef.use === '' ||
      sheetDef.use === null
    ) use = false;
  }
  // XML: $.use 속성
  else if (sheetDef.hasOwnProperty('$') && typeof sheetDef.$.use !== 'undefined') {
    const val = sheetDef.$.use;
    if (
      val === false ||
      val === 0 ||
      val === 'false' ||
      val === '0' ||
      val === '' ||
      val === null
    ) use = false;
  }
  return use;
}

async function main() {
  const argv = yargs
    .option('query', { alias: 'q', describe: '쿼리 정의 파일 경로 (JSON)', default: '' })
    .option('xml', { alias: 'x', describe: '쿼리 정의 파일 경로 (XML)', default: '' })
    .option('config', { alias: 'c', describe: 'DB 접속 정보 파일', default: 'config/dbinfo.json' })
    .option('var', { alias: 'v', describe: '쿼리 변수 (key=value)', array: true, default: [] })
    .option('style', { alias: 's', describe: '엑셀 스타일 템플릿 ID', default: 'default' })
    .option('list-styles', { describe: '사용 가능한 스타일 템플릿 목록 출력', boolean: true })
    .help().argv;

  printAvailableXmlFiles();

  // 스타일 목록 출력 옵션 처리
  if (argv['list-styles']) {
    await listAvailableStyles();
    return;
  }

  // CLI 변수 파싱
  const cliVars = {};
  for (const v of argv.var) {
    const [key, value] = v.split('=');
    cliVars[key] = value;
  }

  let sheets, globalVars = {}, dbId, outputPath, queryDefs = {}, dynamicVars = [];
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    // 파일명 검증
    validateFilename(argv.xml);
    const xmlResult = await loadQueriesFromXML(resolvePath(argv.xml));
    globalVars = xmlResult.globalVars;
    sheets = xmlResult.sheets;
    dbId = xmlResult.dbId;
    outputPath = xmlResult.outputPath;
    queryDefs = xmlResult.queryDefs || {};
    dynamicVars = xmlResult.dynamicVars || [];
  } else if (argv.query && fs.existsSync(resolvePath(argv.query))) {
    // 파일명 검증
    validateFilename(argv.query);
    let queryContent;
    try {
      queryContent = fs.readFileSync(resolvePath(argv.query), 'utf8');
    } catch (error) {
      console.warn(`⚠️  쿼리 파일 읽기 실패: ${argv.query}`);
      console.warn(`   오류: ${error.message}`);
      console.warn(`   💡 해결방법: 파일명에 한글이 포함되어 있다면 영문으로 변경해주세요.`);
      throw new Error(`쿼리 파일을 읽을 수 없습니다: ${argv.query}\n파일명에 한글이 포함되어 있으면 영문으로 변경해주세요.`);
    }
    const queries = JSON5.parse(queryContent);
    globalVars = queries.vars || {};
    
    // JSON에서 쿼리 정의 파싱
    queryDefs = queries.queryDefs || {};
    
    // JSON에서 동적 변수 파싱
    dynamicVars = queries.dynamicVars || [];
    
    // JSON 시트에서 queryRef 처리
    sheets = (queries.sheets || []).map(sheet => {
      let query = sheet.query || '';
      
      // queryRef가 있으면 쿼리 정의에서 참조
      if (sheet.queryRef) {
        if (queryDefs[sheet.queryRef]) {
          query = queryDefs[sheet.queryRef].query || queryDefs[sheet.queryRef];
          console.log(`[쿼리 참조] 시트 "${sheet.name}"이(가) 쿼리 정의 "${sheet.queryRef}"을(를) 참조합니다.`);
        } else {
          throw new Error(`쿼리 정의를 찾을 수 없습니다: ${sheet.queryRef} (시트: ${sheet.name})`);
        }
      }
      
      return {
        ...sheet,
        query: query
      };
    });
    
    dbId = queries.db;
    outputPath = queries.output;
  } else {
    throw new Error('쿼리 정의 파일을 찾을 수 없습니다. --query 또는 --xml 옵션을 확인하세요.');
  }

  // CLI 변수 > 파일 전역변수 우선 적용
  const mergedVars = { ...globalVars, ...cliVars };

  // 기본값 설정
  let excelStyle = {};
  let excelDb = undefined;
  let excelOutput = undefined;
  let createSeparateToc = false; // 별도 목차 파일 생성 여부
  let globalMaxRows = null; // 전역 최대 조회 건수
  
  // 기본 스타일 템플릿 적용 (CLI 옵션)
  const selectedStyle = await getStyleById(argv.style);
  if (selectedStyle) {
    console.log(`🎨 CLI에서 지정된 스타일: ${selectedStyle.name} (${selectedStyle.description})`);
    excelStyle = {
      header: selectedStyle.header || {},
      body: selectedStyle.body || {}
    };
  } else {
    console.warn(`⚠️  CLI에서 지정된 스타일 템플릿을 찾을 수 없습니다: ${argv.style}`);
    console.warn(`   💡 기본 스타일을 사용합니다.`);
  }
  
  if (argv.xml && fs.existsSync(resolvePath(argv.xml))) {
    let xml;
    try {
      xml = fs.readFileSync(resolvePath(argv.xml), 'utf8');
    } catch (error) {
      console.warn(`⚠️  XML 파일 읽기 실패: ${argv.xml}`);
      console.warn(`   오류: ${error.message}`);
      console.warn(`   💡 해결방법: 파일명에 한글이 포함되어 있다면 영문으로 변경해주세요.`);
      throw new Error(`XML 파일을 읽을 수 없습니다: ${argv.xml}\n파일명에 한글이 포함되어 있으면 영문으로 변경해주세요.`);
    }
    const parsed = await xml2js.parseStringPromise(xml, { trim: true });
    
    // queries 루트 엘리먼트에서 separateToc 속성 확인
    if (parsed.queries && parsed.queries.$) {
      if (parsed.queries.$.separateToc) createSeparateToc = parsed.queries.$.separateToc === 'true';
    }
    
    if (parsed.queries && parsed.queries.excel && parsed.queries.excel[0]) {
      const excel = parsed.queries.excel[0];
      if (excel.$ && excel.$.db) excelDb = excel.$.db;
      if (excel.$ && excel.$.output) excelOutput = excel.$.output;
      // excel 엘리먼트의 separateToc가 있으면 우선적용 (덮어쓰기)
      if (excel.$ && excel.$.separateToc) createSeparateToc = excel.$.separateToc === 'true';
      // excel 엘리먼트의 maxRows 읽기
      if (excel.$ && excel.$.maxRows) globalMaxRows = parseInt(excel.$.maxRows);
      // XML에서 스타일 템플릿 ID 읽기 (CLI 옵션보다 우선)
      if (excel.$ && excel.$.style) {
        const xmlStyleId = excel.$.style;
        const xmlStyle = await getStyleById(xmlStyleId);
        if (xmlStyle) {
          console.log(`🎨 XML에서 지정된 스타일: ${xmlStyle.name} (${xmlStyle.description})`);
          excelStyle = {
            header: xmlStyle.header || {},
            body: xmlStyle.body || {}
          };
        } else {
          console.warn(`⚠️  XML에서 지정된 스타일을 찾을 수 없습니다: ${xmlStyleId}`);
        }
      }
      
      // XML에서 스타일 속성이 있으면 템플릿 스타일을 덮어씀
      if (excel.header && excel.header[0]) {
        const h = excel.header[0];
        if (h.font && h.font[0] && h.font[0].$) excelStyle.header.font = { ...excelStyle.header.font, ...h.font[0].$ };
        if (h.fill && h.fill[0] && h.fill[0].$) excelStyle.header.fill = { ...excelStyle.header.fill, ...h.fill[0].$ };
        if (h.colwidths && h.colwidths[0] && h.colwidths[0].$) excelStyle.header.colwidths = { ...excelStyle.header.colwidths, ...h.colwidths[0].$ };
        if (h.alignment && h.alignment[0] && h.alignment[0].$) {
          excelStyle.header.alignment = { ...excelStyle.header.alignment, ...h.alignment[0].$ };
        }
        if (h.border && h.border[0]) {
          excelStyle.header.border = { ...excelStyle.header.border, ...parseXmlBorder(h.border[0]) };
        }
      }
      if (excel.body && excel.body[0]) {
        const b = excel.body[0];
        if (b.font && b.font[0] && b.font[0].$) excelStyle.body.font = { ...excelStyle.body.font, ...b.font[0].$ };
        if (b.fill && b.fill[0] && b.fill[0].$) excelStyle.body.fill = { ...excelStyle.body.fill, ...b.fill[0].$ };
        if (b.alignment && b.alignment[0] && b.alignment[0].$) {
          excelStyle.body.alignment = { ...excelStyle.body.alignment, ...b.alignment[0].$ };
        }
        if (b.border && b.border[0]) {
          excelStyle.body.border = { ...excelStyle.body.border, ...parseXmlBorder(b.border[0]) };
        }
      }
    }
  } else if (argv.query && fs.existsSync(resolvePath(argv.query))) {
    const queries = JSON5.parse(fs.readFileSync(resolvePath(argv.query), 'utf8'));
    if (queries.excel) {
      excelStyle = queries.excel;
      if (queries.excel.db) excelDb = queries.excel.db;
      if (queries.excel.output) excelOutput = queries.excel.output;
      if (queries.excel.separateToc !== undefined) createSeparateToc = queries.excel.separateToc;
      if (queries.excel.maxRows !== undefined) globalMaxRows = parseInt(queries.excel.maxRows);
    }
  }

  // DB 접속 정보 로드 (멀티 DB 지원)
  const configPath = resolvePath(argv.config);
  if (!fs.existsSync(configPath)) {
    throw new Error(`DB 접속 정보 파일이 존재하지 않습니다: ${configPath}`);
  }
  const configObj = JSON5.parse(fs.readFileSync(configPath, 'utf8'));
  
  // 다중 DB 연결 관리 객체
  const dbPools = {};
  
  // 기본 DB 연결 설정
  const defaultDbKey = argv.db || dbId || excelDb;
  if (!configObj.dbs || !configObj.dbs[defaultDbKey]) {
    throw new Error(`기본 DB 접속 ID를 찾을 수 없습니다: ${defaultDbKey}`);
  }
  
  // DB 연결 풀 생성 함수
  async function getDbPool(dbKey) {
    if (!dbPools[dbKey]) {
      if (!configObj.dbs[dbKey]) {
    throw new Error(`DB 접속 ID를 찾을 수 없습니다: ${dbKey}`);
  }
      console.log(`[DB] ${dbKey} 데이터베이스에 연결 중...`);
      const pool = new mssql.ConnectionPool(configObj.dbs[dbKey]);
  await pool.connect();
      dbPools[dbKey] = pool;
      console.log(`[DB] ${dbKey} 데이터베이스 연결 완료`);
    }
    return dbPools[dbKey];
  }
  
  // 기본 DB 연결
  const defaultPool = await getDbPool(defaultDbKey);

  // 동적 변수 처리 (DB 연결 후, 시트 처리 전)
  if (dynamicVars && dynamicVars.length > 0) {
    await processDynamicVariables(dynamicVars, defaultPool, mergedVars);
  }

  // 엑셀 파일 경로 결정 (CLI > excel > 쿼리파일 > 기본값)
  let outFile = argv.out || excelOutput || outputPath || 'output.xlsx';
  outFile = path.isAbsolute(outFile) ? outFile : path.join(process.cwd(), outFile);
  // 파일명에 _yyyymmddhhmmss 추가
  const ext = path.extname(outFile);
  const base = outFile.slice(0, -ext.length);
  outFile = `${base}_${getNowTimestampStr()}${ext}`;
  ensureDirExists(outFile);

  console.log('-------------------------------------------------------------------------------');
  console.log(`[${outFile}] START WORK`);
  console.log('-------------------------------------------------------------------------------');
  const workbook = new ExcelJS.Workbook();
  const createdSheetNames = [];
  const createdSheetCounts = [];

  // 목차 시트를 맨 처음에 생성 (내용은 나중에 채움)
  let tocSheet = null;
  
  for (const sheetDef of sheets) {
    // robust use 속성 체크
    if (!isSheetEnabled(sheetDef)) {
      console.log(`[SKIP] Sheet '${sheetDef.name}' is disabled (use=false)`);
      continue;
    }
    
    // 첫 번째 활성 시트일 때 목차 시트 생성
    if (!tocSheet) {
      tocSheet = workbook.addWorksheet('목차');
      console.log(`[목차] 맨 첫 번째 시트로 생성됨`);
    }
    
    let sql = substituteVars(sheetDef.query, mergedVars);
    const sheetName = substituteVars(sheetDef.name, mergedVars);
    
    // maxRows 제한 적용 (개별 시트 설정 > 전역 설정 우선)
    const effectiveMaxRows = sheetDef.maxRows || globalMaxRows;
    if (effectiveMaxRows && effectiveMaxRows > 0) {
      // SQL에 TOP 절이 없는 경우에만 추가
      if (!sql.trim().toUpperCase().includes('TOP ')) {
        // SELECT 다음에 TOP N을 삽입
        sql = sql.replace(/^\s*SELECT\s+/i, `SELECT TOP ${effectiveMaxRows} `);
        const source = sheetDef.maxRows ? '시트별' : '전역';
        console.log(`\t[제한] 최대 ${effectiveMaxRows}건으로 제한됨 (${source} 설정)`);
      } else {
        console.log(`\t[제한] 쿼리에 이미 TOP 절이 존재하여 maxRows 설정 무시됨`);
      }
    }
    
    // 시트별 DB 연결 결정 (개별 시트 설정 > 기본 DB 설정 우선)
    const sheetDbKey = sheetDef.db || defaultDbKey;
    const currentPool = await getDbPool(sheetDbKey);
    
    console.log(`[INFO] Executing for sheet '${sheetName}' on DB '${sheetDbKey}'`);
    try {
      const result = await currentPool.request().query(sql);
      const sheet = workbook.addWorksheet(sheetName);
      const recordCount = result.recordset.length;
      
      // 실제 생성된 시트명 가져오기 (31자 초과시 잘린 이름)
      const actualSheetName = sheet.name;
      
      // 집계 컬럼이 지정된 경우 집계 데이터 계산
      let aggregateData = null;
      if (sheetDef.aggregateColumn && recordCount > 0) {
        const aggregateColumn = sheetDef.aggregateColumn;
        const aggregateMap = {};
        
        result.recordset.forEach(row => {
          const value = row[aggregateColumn];
          if (value !== null && value !== undefined) {
            const key = String(value).trim();
            aggregateMap[key] = (aggregateMap[key] || 0) + 1;
          }
        });
        
        // 집계 결과를 배열로 변환 (건수가 많은 순으로 정렬)
        aggregateData = Object.entries(aggregateMap)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count);
          
        console.log(`\t[집계] ${aggregateColumn} 컬럼 집계: ${aggregateData.map(item => `${item.key}(${item.count})`).join(', ')}`);
      }
      
      createdSheetNames.push({ 
        displayName: sheetName, 
        originalName: sheetName,
        tabName: actualSheetName, 
        recordCount: recordCount,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateData: aggregateData
      });
      createdSheetCounts.push(recordCount);
      
      // 시트명이 잘렸는지 확인하고 로그 출력
      if (sheetName !== actualSheetName) {
        console.log(`\t[WARN] Sheet name truncated: '${sheetName}' → '${actualSheetName}'`);
      }
      
      if (recordCount > 0) {
        // 시트별 스타일 적용 (우선순위: 시트별 > XML 전역 > CLI > 기본)
        let sheetStyle = excelStyle; // 기본값은 전역 스타일
        
        if (sheetDef.style) {
          const sheetStyleTemplate = await getStyleById(sheetDef.style);
          if (sheetStyleTemplate) {
            console.log(`\t🎨 시트별 스타일 적용: ${sheetStyleTemplate.name} (${sheetStyleTemplate.description})`);
            sheetStyle = {
              header: sheetStyleTemplate.header || {},
              body: sheetStyleTemplate.body || {}
            };
          } else {
            console.warn(`\t⚠️  시트별 스타일을 찾을 수 없습니다: ${sheetDef.style}`);
            console.warn(`\t   💡 전역 스타일을 사용합니다.`);
          }
        } else {
          console.log(`\t🎨 전역 스타일 적용: ${excelStyle.header?.font?.name || '기본'} 스타일`);
        }
        
        // 데이터와 스타일 적용 (1행부터 시작)
        excelStyleHelper.applySheetStyle(sheet, result.recordset, sheetStyle, 1);
        
        // 데이터 추가 후 맨 앞에 DB 정보 행 삽입
        sheet.spliceRows(1, 0, [`📊 출처: ${sheetDbKey} DB`]);
        sheet.spliceRows(2, 0, []);  // 빈 행 추가
        
        // DB 정보 셀 스타일링
        const dbCell = sheet.getCell('A1');
        dbCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        dbCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        
        console.log(`\t[DB정보] ${sheetDbKey} DB 출처 표시 완료`);
      } else {
        // 데이터가 없는 경우
        sheet.addRow([`📊 출처: ${sheetDbKey} DB`]);
        sheet.addRow([]);
        sheet.addRow(['데이터가 없습니다.']);
        
        // 스타일링
        sheet.getCell('A1').font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        sheet.getCell('A3').font = { italic: true, color: { argb: '999999' } };
        
        console.log(`\t[DB정보] ${sheetDbKey} DB 출처 표시 완료 (데이터 없음)`);
      }
      console.log(`\t---> ${recordCount} rows were selected `);
    } catch (error) {
      console.log(`----------------------------------[ERROR]--------------------------------------\n`);
      console.log(error);
      console.log(`\n\nSQL: ${sql}`);
      console.log('\n-------------------------------------------------------------------------------');
    }
  }
  
  // 목차 시트에 내용 채우기
  if (createdSheetNames.length > 0 && tocSheet) {
    // excel-style-helper 모듈의 함수 사용하여 안전한 목차 생성
    excelStyleHelper.populateTableOfContents(tocSheet, createdSheetNames);
    
    // 목차 시트를 첫 번째로 이동
    workbook.worksheets = [tocSheet, ...workbook.worksheets.filter(ws => ws.name !== '목차')];
    
    console.log(`[목차] 내용 채우기 완료 (총 ${createdSheetNames.length}개 시트)`);

    if (createSeparateToc) {
    // 별도 목차 엑셀 파일 생성
    const tocWb = new ExcelJS.Workbook();
    const tocOnly = tocWb.addWorksheet('목차');
    tocOnly.addRow(['No', 'Sheet Name', 'Data Count']);
    createdSheetNames.forEach((obj, idx) => {
      const row = tocOnly.addRow([idx + 1, obj.displayName, createdSheetCounts[idx]]);
      row.getCell(2).font = { color: { argb: '0563C1' }, underline: true };
      row.getCell(3).font = { color: { argb: '0563C1' }, underline: true };
    });
    tocOnly.getRow(1).font = { bold: true };
    tocOnly.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Sheet Name', key: 'name', width: 30 },
      { header: 'Data Count', key: 'count', width: 12 }
    ];
    const tocExt = path.extname(outFile);
    const tocBase = outFile.slice(0, -tocExt.length);
    const tocFile = `${tocBase}_목차_${getNowTimestampStr()}${tocExt}`;
    await tocWb.xlsx.writeFile(tocFile);
    console.log(`[목차] 별도 엑셀 파일 생성: ${tocFile}`);
    }

  }
  console.log(`\nGenerating excel file ... `);
  console.log(`Wating a few seconds ... `);
  await workbook.xlsx.writeFile(outFile);
  console.log(`\n\n[${outFile}] Excel file created `);
  console.log('-------------------------------------------------------------------------------\n\n');
  
  // 모든 DB 연결 정리
  for (const [dbKey, pool] of Object.entries(dbPools)) {
    console.log(`[DB] ${dbKey} 데이터베이스 연결 종료`);
  await pool.close();
  }
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}