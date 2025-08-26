const ExcelJS = require('exceljs');
const excelStyleHelper = require('./excel-style-helper');
const FileUtils = require('./file-utils');

/**
 * 엑셀 생성 관련 함수들을 담당하는 모듈
 */
class ExcelGenerator {
  constructor() {
    this.fileUtils = FileUtils;
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
      createSeparateToc = false,
      createdSheetNames = [],
      createdSheetCounts = []
    } = options;

    console.log('-------------------------------------------------------------------------------');
    console.log(`[${outputPath}] START WORK`);
    console.log('-------------------------------------------------------------------------------');
    
    const workbook = new ExcelJS.Workbook();
    const createdSheets = [];

    // 목차 시트를 맨 처음에 생성 (내용은 나중에 채움)
    let tocSheet = null;
    
    for (const sheetDef of sheets) {
      // robust use 속성 체크
      if (!this.isSheetEnabled(sheetDef)) {
        console.log(`[SKIP] Sheet '${sheetDef.name}' is disabled (use=false)`);
        continue;
      }
      
      // 첫 번째 활성 시트일 때 목차 시트 생성
      if (!tocSheet) {
        tocSheet = workbook.addWorksheet('목차');
        console.log(`[목차] 맨 첫 번째 시트로 생성됨`);
      }
      
      const sheet = workbook.addWorksheet(sheetDef.name);
      const recordCount = sheetDef.recordCount || 0;
      
      // 실제 생성된 시트명 가져오기 (31자 초과시 잘린 이름)
      const actualSheetName = sheet.name;
      
      // 집계 컬럼이 지정된 경우 집계 데이터 계산
      let aggregateData = null;
      if (sheetDef.aggregateColumn && recordCount > 0) {
        aggregateData = this.calculateAggregateData(sheetDef.aggregateColumn, sheetDef.data);
        console.log(`\t[집계] ${sheetDef.aggregateColumn} 컬럼 집계: ${aggregateData.map(item => `${item.key}(${item.count})`).join(', ')}`);
      }
      
      createdSheets.push({ 
        displayName: sheetDef.name, 
        originalName: sheetDef.name,
        tabName: actualSheetName, 
        recordCount: recordCount,
        aggregateColumn: sheetDef.aggregateColumn,
        aggregateData: aggregateData,
        query: sheetDef.query || '' // 쿼리문 정보 추가
      });
      
      // 시트명이 잘렸는지 확인하고 로그 출력
      if (sheetDef.name !== actualSheetName) {
        console.log(`\t[WARN] Sheet name truncated: '${sheetDef.name}' → '${actualSheetName}'`);
      }
      
      if (recordCount > 0) {
        // 데이터와 스타일 적용 (1행부터 시작)
        excelStyleHelper.applySheetStyle(sheet, sheetDef.data, sheetDef.style, 1);
        
        // 데이터 추가 후 맨 앞에 DB 정보 행 삽입
        sheet.spliceRows(1, 0, [`📊 출처: ${sheetDef.dbKey} DB`]);
        sheet.spliceRows(2, 0, []);  // 빈 행 추가
        
        // DB 정보 셀 스타일링
        const dbCell = sheet.getCell('A1');
        dbCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        dbCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        
        console.log(`\t[DB정보] ${sheetDef.dbKey} DB 출처 표시 완료`);
      } else {
        // 데이터가 없는 경우
        sheet.addRow([`📊 출처: ${sheetDef.dbKey} DB`]);
        sheet.addRow([]);
        sheet.addRow(['데이터가 없습니다.']);
        
        // 스타일링
        sheet.getCell('A1').font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
        sheet.getCell('A3').font = { italic: true, color: { argb: '999999' } };
        
        console.log(`\t[DB정보] ${sheetDef.dbKey} DB 출처 표시 완료 (데이터 없음)`);
      }
      console.log(`\t---> ${recordCount} rows were selected `);
    }
    
    // 목차 시트에 내용 채우기
    if (createdSheets.length > 0 && tocSheet) {
      // excel-style-helper 모듈의 함수 사용하여 안전한 목차 생성
      excelStyleHelper.populateTableOfContents(tocSheet, createdSheets);
      
      // 목차 시트를 첫 번째로 이동 (ExcelJS에서는 worksheets가 읽기 전용이므로 다른 방법 사용)
      // 목차 시트는 이미 첫 번째로 생성되었으므로 추가 조작 불필요
      
      console.log(`[목차] 내용 채우기 완료 (총 ${createdSheets.length}개 시트)`);

      if (createSeparateToc) {
        await this.createSeparateTocFile(outputPath, createdSheets, createdSheetCounts);
      }
    }
    
    console.log(`\nGenerating excel file ... `);
    console.log(`Wating a few seconds ... `);
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n\n[${outputPath}] Excel file created `);
    console.log('-------------------------------------------------------------------------------\n\n');
    
    return outputPath;
  }

  /**
   * 별도 목차 파일 생성
   * @param {string} outputPath - 원본 출력 파일 경로
   * @param {Array} createdSheetNames - 생성된 시트 정보
   * @param {Array} createdSheetCounts - 시트별 데이터 개수
   */
  async createSeparateTocFile(outputPath, createdSheetNames, createdSheetCounts) {
    const tocWb = new ExcelJS.Workbook();
    const tocOnly = tocWb.addWorksheet('목차');
    tocOnly.addRow(['No', 'Sheet Name', 'Data Count', 'Query']);
    
    createdSheetNames.forEach((obj, idx) => {
      // 쿼리문 정보 추출 (최대 80자로 제한)
      let queryText = '';
      if (obj.query) {
        queryText = obj.query.replace(/\s+/g, ' ').trim(); // 연속 공백 제거
        if (queryText.length > 80) {
          queryText = queryText.substring(0, 77) + '...';
        }
      }
      
      const row = tocOnly.addRow([idx + 1, obj.displayName, createdSheetCounts[idx], queryText]);
      row.getCell(2).font = { color: { argb: '0563C1' }, underline: true };
      row.getCell(3).font = { color: { argb: '0563C1' }, underline: true };
      
      // 쿼리문 셀 스타일링
      const queryCell = row.getCell(4);
      if (queryText) {
        queryCell.font = { 
          size: 9,
          color: { argb: '2F5597' }
        };
        queryCell.alignment = { 
          horizontal: 'left', 
          vertical: 'middle',
          wrapText: true 
        };
      }
    });
    
    tocOnly.getRow(1).font = { bold: true };
    tocOnly.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Sheet Name', key: 'name', width: 30 },
      { header: 'Data Count', key: 'count', width: 12 },
      { header: 'Query', key: 'query', width: 50 }
    ];
    
    const tocExt = FileUtils.getExtension(outputPath);
    const tocBase = outputPath.slice(0, -tocExt.length);
    const tocFile = `${tocBase}_목차_${FileUtils.getNowTimestampStr()}${tocExt}`;
    
    await tocWb.xlsx.writeFile(tocFile);
    console.log(`[목차] 별도 엑셀 파일 생성: ${tocFile}`);
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
