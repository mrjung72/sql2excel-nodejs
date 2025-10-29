const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const excelStyleHelper = require('./excel-style-helper');
const FileUtils = require('./file-utils');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        startWork: 'START WORK',
        skipSheet: 'Sheet',
        isDisabled: 'is disabled (use=false)',
        tocSheetName: 'Table of Contents',
        tocCreated: 'Created as first sheet',
        sheetTruncated: 'Sheet name truncated:',
        dbSource: '📊 Source:',
        db: 'DB',
        createdTime: '🕒 Created:',
        dbInfoComplete: 'DB source displayed',
        createdTimeComplete: 'Creation time displayed',
        noData: 'No data',
        noDataSuffix: '',
        rowsSelected: 'rows were selected',
        tocPopulated: 'Table of contents populated (total',
        sheets: 'sheets)',
        generatingExcel: 'Generating excel file ...',
        waitingSeconds: 'Waiting a few seconds ...',
        excelCreated: 'Excel file created'
    },
    kr: {
        startWork: '작업 시작',
        skipSheet: '시트',
        isDisabled: '비활성화됨 (use=false)',
        tocSheetName: '목차',
        tocCreated: '맨 첫 번째 시트로 생성됨',
        sheetTruncated: '시트명이 잘렸습니다:',
        dbSource: '📊 출처:',
        db: 'DB',
        createdTime: '🕒 생성일시:',
        dbInfoComplete: 'DB 출처 표시 완료',
        createdTimeComplete: '표시 완료',
        noData: '데이터가 없습니다',
        noDataSuffix: '.',
        rowsSelected: '행이 선택됨',
        tocPopulated: '목차 내용 채우기 완료 (총',
        sheets: '개 시트)',
        generatingExcel: '엑셀 파일을 생성하고 있습니다 ...',
        waitingSeconds: '몇 초만 기다려주세요 ...',
        excelCreated: '엑셀 파일이 생성되었습니다'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * 엑셀 생성 관련 함수들을 담당하는 모듈
 */
class ExcelGenerator {
  constructor() {
    this.fileUtils = FileUtils;
  }

  async exportPerSheetFiles(options) {
    const { sheets, outputPath, format } = options;
    const ext = FileUtils.getExtension(outputPath).toLowerCase();
    const dir = FileUtils.getDirname(outputPath);
    const base = FileUtils.getBasename(outputPath);
    const extNoDot = ext.startsWith('.') ? ext.slice(1) : ext;
    const targetDir = path.join(dir, `${base}_${extNoDot}`);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const delimiter = format === 'txt' ? '\t' : ',';
    const withBOM = true;
    const crlf = '\r\n';

    function sanitizeFilename(name) {
      const replaced = String(name).replace(/[\\/:*?"<>|]/g, '_').trim();
      return replaced.substring(0, 100) || 'sheet';
    }
    function sanitizeIdentifier(name) {
      let id = String(name).replace(/[^A-Za-z0-9_]/g, '_');
      if (/^[0-9]/.test(id)) id = 'T_' + id;
      return id || 'T_SHEET';
    }
    function escapeCsv(val) {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(delimiter)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }
    function toSqlLiteral(val) {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
      const s = String(val).replace(/'/g, "''");
      return `'${s}'`;
    }

    for (const sheetDef of sheets) {
      if (!this.isSheetEnabled(sheetDef)) continue;
      const baseName = sheetDef.originalName || sheetDef.name;
      const safeName = sanitizeFilename(baseName);
      const filePath = path.join(targetDir, `${safeName}${ext}`);
      FileUtils.ensureDirExists(filePath);
      const rows = Array.isArray(sheetDef.data) ? sheetDef.data : [];

      if (format === 'sql') {
        const colsSet = new Set();
        rows.forEach(r => Object.keys(r || {}).forEach(k => colsSet.add(k)));
        const columns = Array.from(colsSet);
        const table = sanitizeIdentifier(baseName);
        const lines = [];
        if (columns.length === 0) {
          const single = `-- No data`;
          lines.push(single);
        } else {
          for (const r of rows) {
            const values = columns.map(c => toSqlLiteral(r && r[c] !== undefined ? r[c] : null)).join(', ');
            lines.push(`INSERT INTO ${table} (${columns.map(c => `[${c}]`).join(', ')}) VALUES (${values});`);
          }
        }
        const content = lines.join(crlf) + crlf;
        const data = withBOM ? Buffer.from('\ufeff' + content, 'utf8') : Buffer.from(content, 'utf8');
        fs.writeFileSync(filePath, data);
        console.log(`[WRITE] ${filePath}`);
        continue;
      }

      const colsSet = new Set();
      rows.forEach(r => Object.keys(r || {}).forEach(k => colsSet.add(k)));
      const columns = Array.from(colsSet);
      const lines = [];
      if (columns.length > 0) lines.push(columns.join(delimiter));
      for (const r of rows) {
        const vals = columns.map(c => escapeCsv(r && r[c] !== undefined ? r[c] : ''));
        lines.push(vals.join(delimiter));
      }
      const content = lines.join(crlf) + crlf;
      const data = withBOM ? Buffer.from('\ufeff' + content, 'utf8') : Buffer.from(content, 'utf8');
      fs.writeFileSync(filePath, data);
      console.log(`[WRITE] ${filePath}`);
    }
  }

  /**
   * 엑셀 파일 생성
   * @param {Object} options - 생성 옵션
   * @returns {Promise<string>} 생성된 파일 경로
   */
  async generateExcel(options) {
    const {
      sheets,
      outputPath,
      createdSheetNames = [],
      createdSheetCounts = []
    } = options;

    console.log('-------------------------------------------------------------------------------');
    console.log(`[${outputPath}] ${msg.startWork}`);
    console.log('-------------------------------------------------------------------------------');
    
    const workbook = new ExcelJS.Workbook();
    const createdSheets = [];

    // 목차 시트를 맨 처음에 생성 (내용은 나중에 채움)
    let tocSheet = null;

    for (const sheetDef of sheets) {
      // robust use 속성 체크
      if (!this.isSheetEnabled(sheetDef)) {
        console.log(`[SKIP] ${msg.skipSheet} '${sheetDef.name}' ${msg.isDisabled}`);
        continue;
      }
      
      // 첫 번째 활성 시트일 때 목차 시트 생성
      if (!tocSheet) {
        tocSheet = workbook.addWorksheet(msg.tocSheetName);
        console.log(`[${msg.tocSheetName}] ${msg.tocCreated}`);
      }
      
      const sheet = workbook.addWorksheet(sheetDef.name);
      const recordCount = sheetDef.recordCount || 0;
      
      // 실제 생성된 시트명 가져오기 (31자 초과시 잘린 이름)
      const actualSheetName = sheet.name;
      
      // 집계 데이터는 이미 sheetDef에서 전달받음
      let aggregateData = sheetDef.aggregateData;
      
      createdSheets.push({ 
        displayName: sheetDef.name, 
        originalName: sheetDef.originalName || sheetDef.name,
        tabName: actualSheetName, 
        recordCount: recordCount,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateInfoTemplate: sheetDef.aggregateInfoTemplate, // 집계 정보 템플릿 추가
        aggregateData: aggregateData,
        query: sheetDef.query || '' // 쿼리문 정보 추가
      });
      
      // 시트명이 잘렸는지 확인하고 로그 출력
      if (sheetDef.name !== actualSheetName) {
        console.log(`\t[WARN] ${msg.sheetTruncated} '${sheetDef.name}' → '${actualSheetName}'`);
      }
      
      // 현재 날짜와 시간 생성
      const now = new Date();
      const creationDateTime = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      if (recordCount > 0) {
        // 데이터와 스타일 적용 (1행부터 시작)
        excelStyleHelper.applySheetStyle(sheet, sheetDef.data, sheetDef.style, 1);
        
        // 데이터 추가 후 맨 앞에 정보 행들 삽입
        sheet.spliceRows(1, 0, [`${msg.dbSource} ${sheetDef.dbKey} ${msg.db}`]);
        sheet.spliceRows(2, 0, [`${msg.createdTime} ${creationDateTime}`]);
        sheet.spliceRows(3, 0, []);  // 빈 행 추가
        
        // DB 정보 셀 스타일링
        const dbCell = sheet.getCell('A1');
        dbCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        dbCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        
        // 생성일시 셀 스타일링
        const dateTimeCell = sheet.getCell('A2');
        dateTimeCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        dateTimeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        
        console.log(`\t[${msg.dbSource}] ${sheetDef.dbKey} ${msg.db} ${msg.dbInfoComplete}`);
        console.log(`\t[${msg.createdTime}] ${creationDateTime} ${msg.createdTimeComplete}`);
      } else {
        // 데이터가 없는 경우
        sheet.addRow([`${msg.dbSource} ${sheetDef.dbKey} ${msg.db}`]);
        sheet.addRow([`${msg.createdTime} ${creationDateTime}`]);
        sheet.addRow([]);
        sheet.addRow([`${msg.noData}${msg.noDataSuffix}`]);
        
        // 스타일링
        sheet.getCell('A1').font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        
        sheet.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        
        sheet.getCell('A4').font = { italic: true, color: { argb: '999999' } };
        
        console.log(`\t[${msg.dbSource}] ${sheetDef.dbKey} ${msg.db} ${msg.dbInfoComplete} (${msg.noData})`);
        console.log(`\t[${msg.createdTime}] ${creationDateTime} ${msg.createdTimeComplete} (${msg.noData})`);
      }
      console.log(`\t---> ${recordCount} ${msg.rowsSelected} `);
    }
    
    // 목차 시트에 내용 채우기
    if (createdSheets.length > 0 && tocSheet) {
      // excel-style-helper 모듈의 함수 사용하여 안전한 목차 생성
      excelStyleHelper.populateTableOfContents(tocSheet, createdSheets);
      
      // 목차 시트를 첫 번째로 이동 (ExcelJS에서는 worksheets가 읽기 전용이므로 다른 방법 사용)
      // 목차 시트는 이미 첫 번째로 생성되었으므로 추가 조작 불필요
      
      console.log(`[${msg.tocSheetName}] ${msg.tocPopulated} ${createdSheets.length}${msg.sheets}`);
    }
    
    console.log(`\n${msg.generatingExcel}`);
    console.log(`${msg.waitingSeconds}`);
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n\n[${outputPath}] ${msg.excelCreated} `);
    console.log('-------------------------------------------------------------------------------\n\n');
    
    return outputPath;
  }

  /**
   * 시트가 활성화되어 있는지 확인
   * @param {Object} sheetDef - 시트 정의 객체
   * @returns {boolean} 활성화 여부
   */
  isSheetEnabled(sheetDef) {
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

  /**
   * 집계 데이터 계산
   * @param {string} aggregateColumn - 집계 컬럼명
   * @param {Array} data - 데이터 배열
   * @returns {Array} 집계 결과
   */
  calculateAggregateData(aggregateColumn, data) {
    if (!data || data.length === 0) return [];
    
    const aggregateMap = {};
    
    data.forEach(row => {
      const value = row[aggregateColumn];
      if (value !== null && value !== undefined) {
        const key = String(value).trim();
        aggregateMap[key] = (aggregateMap[key] || 0) + 1;
      }
    });
    
    // 집계 결과를 배열로 변환 (건수가 많은 순으로 정렬)
    return Object.entries(aggregateMap)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 엑셀 파일 경로 생성
   * @param {string} basePath - 기본 경로
   * @param {string} timestamp - 타임스탬프
   * @returns {string} 생성된 파일 경로
   */
  generateOutputPath(basePath, timestamp) {
    const ext = FileUtils.getExtension(basePath);
    const base = basePath.slice(0, -ext.length);
    return `${base}_${timestamp}${ext}`;
  }

  /**
   * 엑셀 파일 검증
   * @param {string} filePath - 파일 경로
   * @returns {boolean} 유효성 여부
   */
  validateExcelFile(filePath) {
    const ext = this.fileUtils.getExtension(filePath).toLowerCase();
    return ext === '.xlsx' || ext === '.xls';
  }

  /**
   * 엑셀 파일 크기 확인
   * @param {string} filePath - 파일 경로
   * @returns {number} 파일 크기 (바이트)
   */
  getExcelFileSize(filePath) {
    return FileUtils.getFileSize(filePath);
  }

  /**
   * 엑셀 파일 생성 시간 확인
   * @param {string} filePath - 파일 경로
   * @returns {Date} 생성 시간
   */
  getExcelFileCreatedTime(filePath) {
    return FileUtils.getModifiedTime(filePath);
  }
}

module.exports = ExcelGenerator;
