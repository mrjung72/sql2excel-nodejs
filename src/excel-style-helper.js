/**
 * Excel 셀 스타일 관련 유틸리티 함수들
 * 
 * 이 모듈은 ExcelJS를 사용하여 엑셀 파일의 셀 스타일을 설정하는
 * 다양한 헬퍼 함수들을 제공합니다.
 */

const path = require('path');

// 언어 설정 (환경 변수 사용, 기본값 영어)
const LANGUAGE = process.env.LANGUAGE || 'en';

// 다국어 메시지
const messages = {
    en: {
        tableOfContents: 'Table of Contents',
        truncatedNote: '(Truncated: over 31 chars)',
        originalSheetName: 'Original sheet name:\n',
        actualTabName: '\n\nActual tab name:\n',
        sheetNameLimit: '\n\n※ Excel sheet names are limited to 31 characters.',
        omittedMaxChars: '... omitted (limited to 10,000 characters) .....',
        selectedDataRows: 'Selected data',
        rows: 'rows',
        and: 'and',
        others: 'others',
        hyperlinkFailed: '[WARN] Hyperlink creation failed for sheet:',
        excelToc: '📊 Excel Sheet Table of Contents',
        targetFile: '📁 Target File:',
        sheetName: 'Sheet Name',
        records: 'Records',
        description: 'Description',
        fileLink: 'File Link',
        checkSheetData: 'sheet data',
        openFile: '📂 Open File',
        openFileText: 'Open File',
        usage: '💡 Usage',
        usageStep1: '   1. Click "Open File" link to open the main Excel file',
        usageStep2: '   2. Click the desired sheet tab in the main file',
        usageStep3: '   3. Each sheet is arranged in the order listed above'
    },
    kr: {
        tableOfContents: '목차',
        truncatedNote: '(31자 초과로 잘림)',
        originalSheetName: '원본 시트명:\n',
        actualTabName: '\n\n실제 탭명:\n',
        sheetNameLimit: '\n\n※ Excel 시트명은 최대 31자까지 허용됩니다.',
        omittedMaxChars: '... 이하 생략 (최대 10000자로 제한) .....',
        selectedDataRows: '선택된 데이터',
        rows: '행',
        and: '그리고',
        others: '개 더',
        hyperlinkFailed: '[WARN] 하이퍼링크 생성 실패:',
        excelToc: '📊 Excel 시트 목차',
        targetFile: '📁 대상 파일:',
        sheetName: '시트명',
        records: '데이터 건수',
        description: '설명',
        fileLink: '파일 링크',
        checkSheetData: '시트의 데이터를 확인하세요',
        openFile: '📂 파일 열기',
        openFileText: '파일 열기',
        usage: '💡 사용법',
        usageStep1: '   1. "파일 열기" 링크를 클릭하여 메인 엑셀 파일을 엽니다',
        usageStep2: '   2. 메인 파일에서 원하는 시트 탭을 클릭합니다',
        usageStep3: '   3. 각 시트는 위 목록의 순서대로 배치되어 있습니다'
    }
};

const msg = messages[LANGUAGE] || messages.en;

/**
 * border 객체를 ExcelJS 형식으로 변환
 * @param {Object} border - 테두리 설정 객체
 * @param {Object} border.all - 모든 방향에 적용할 테두리 스타일
 * @param {Object} border.top - 상단 테두리 스타일
 * @param {Object} border.left - 좌측 테두리 스타일
 * @param {Object} border.right - 우측 테두리 스타일
 * @param {Object} border.bottom - 하단 테두리 스타일
 * @returns {Object|undefined} ExcelJS 테두리 객체
 */
function parseBorder(border) {
  if (!border) return undefined;
  
  const makeSide = (side) => {
    if (!border[side]) return undefined;
    return {
      style: border[side].style,
      color: border[side].color ? { argb: border[side].color } : undefined
    };
  };

  if (border.all) {
    const side = makeSide('all');
    return {
      top: side,
      left: side,
      right: side,
      bottom: side
    };
  }

  return {
    top: makeSide('top'),
    left: makeSide('left'),
    right: makeSide('right'),
    bottom: makeSide('bottom')
  };
}

/**
 * font 객체를 ExcelJS 형식으로 변환
 * @param {Object} fontStyle - 폰트 설정 객체
 * @param {string} fontStyle.name - 폰트명
 * @param {number|string} fontStyle.size - 폰트 크기
 * @param {string} fontStyle.color - 폰트 색상 (ARGB)
 * @param {boolean|string} fontStyle.bold - 굵게 여부
 * @returns {Object|undefined} ExcelJS 폰트 객체
 */
function parseFont(fontStyle) {
  if (!fontStyle) return undefined;
  
  return {
    name: fontStyle.name,
    size: fontStyle.size ? Number(fontStyle.size) : undefined,
    color: fontStyle.color ? { argb: fontStyle.color } : undefined,
    bold: fontStyle.bold === 'true' || fontStyle.bold === true
  };
}

/**
 * fill 객체를 ExcelJS 형식으로 변환
 * @param {Object} fillStyle - 채우기 설정 객체
 * @param {string} fillStyle.color - 배경색 (ARGB)
 * @returns {Object|undefined} ExcelJS 채우기 객체
 */
function parseFill(fillStyle) {
  if (!fillStyle || !fillStyle.color) return undefined;
  
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: fillStyle.color }
  };
}

/**
 * alignment 객체를 ExcelJS 형식으로 변환
 * @param {Object} alignmentStyle - 정렬 설정 객체
 * @param {string} alignmentStyle.horizontal - 가로 정렬 (left, center, right)
 * @param {string} alignmentStyle.vertical - 세로 정렬 (top, middle, bottom)
 * @returns {Object|undefined} ExcelJS 정렬 객체
 */
function parseAlignment(alignmentStyle) {
  if (!alignmentStyle) return undefined;
  
  return { ...alignmentStyle };
}

/**
 * 단일 셀에 스타일을 적용
 * @param {Object} cell - ExcelJS 셀 객체
 * @param {Object} style - 적용할 스타일 객체
 * @param {Object} style.font - 폰트 스타일
 * @param {Object} style.fill - 채우기 스타일
 * @param {Object} style.alignment - 정렬 스타일
 * @param {Object} style.border - 테두리 스타일
 */
function applyCellStyle(cell, style) {
  if (!cell || !style) return;

  if (style.font) {
    cell.font = parseFont(style.font);
  }

  if (style.fill) {
    cell.fill = parseFill(style.fill);
  }

  if (style.alignment) {
    cell.alignment = parseAlignment(style.alignment);
  }

  if (style.border) {
    cell.border = parseBorder(style.border);
  }
}

/**
 * 헤더 행에 스타일을 적용
 * @param {Object} sheet - ExcelJS 워크시트 객체
 * @param {Array} columns - 컬럼 배열
 * @param {Object} headerStyle - 헤더 스타일 객체
 */
function applyHeaderStyle(sheet, columns, headerStyle) {
  if (!headerStyle || !sheet || !columns) return;

  for (let i = 1; i <= columns.length; i++) {
    const cell = sheet.getRow(1).getCell(i);
    applyCellStyle(cell, headerStyle);
  }
}

/**
 * 지정된 행에 헤더 스타일을 적용
 * @param {Object} sheet - ExcelJS 워크시트 객체
 * @param {Array} columns - 컬럼 배열
 * @param {Object} headerStyle - 헤더 스타일 객체
 * @param {number} rowNumber - 헤더가 위치할 행 번호
 */
function applyHeaderStyleAtRow(sheet, columns, headerStyle, rowNumber) {
  if (!headerStyle || !sheet || !columns) return;

  for (let i = 1; i <= columns.length; i++) {
    const cell = sheet.getRow(rowNumber).getCell(i);
    applyCellStyle(cell, headerStyle);
  }
}

/**
 * 데이터 행들에 스타일을 적용
 * @param {Object} sheet - ExcelJS 워크시트 객체
 * @param {Array} columns - 컬럼 배열
 * @param {number} dataRowCount - 데이터 행 수
 * @param {Object} bodyStyle - 데이터 스타일 객체
 */
function applyBodyStyle(sheet, columns, dataRowCount, bodyStyle) {
  if (!bodyStyle || !sheet || !columns || dataRowCount <= 0) return;

  for (let r = 0; r < dataRowCount; r++) {
    const row = sheet.getRow(r + 2); // 헤더 다음 행부터
    for (let i = 1; i <= columns.length; i++) {
      const cell = row.getCell(i);
      applyCellStyle(cell, bodyStyle);
    }
  }
}

/**
 * 지정된 시작 행부터 데이터 행들에 스타일을 적용
 * @param {Object} sheet - ExcelJS 워크시트 객체
 * @param {Array} columns - 컬럼 배열
 * @param {number} dataRowCount - 데이터 행 수
 * @param {Object} bodyStyle - 데이터 스타일 객체
 * @param {number} startRow - 데이터 시작 행 번호
 */
function applyBodyStyleAtRow(sheet, columns, dataRowCount, bodyStyle, startRow) {
  if (!bodyStyle || !sheet || !columns || dataRowCount <= 0) return;

  for (let r = 0; r < dataRowCount; r++) {
    const row = sheet.getRow(startRow + r);
    for (let i = 1; i <= columns.length; i++) {
      const cell = row.getCell(i);
      applyCellStyle(cell, bodyStyle);
    }
  }
}

/**
 * 컬럼 너비를 자동으로 계산
 * @param {Array} columns - 컬럼명 배열
 * @param {Array} data - 데이터 배열
 * @param {Object} colwidths - 너비 설정 객체
 * @param {number} colwidths.min - 최소 너비
 * @param {number} colwidths.max - 최대 너비
 * @returns {Array} 계산된 너비 배열
 */
function calculateColumnWidths(columns, data, colwidths = { min: 10, max: 30 }) {
  const { min, max } = colwidths;

  return columns.map((col) => {
    let maxLen = col.length; // 헤더 길이부터 시작
    
    // 각 데이터 행의 해당 컬럼 값 길이 확인
    for (const row of data) {
      const val = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    }
    
    // 최소/최대 너비 제한 적용
    return Math.max(min, Math.min(max, maxLen));
  });
}

/**
 * 시트에 데이터와 스타일을 모두 적용
 * @param {Object} sheet - ExcelJS 워크시트 객체
 * @param {Array} data - 데이터 배열
 * @param {Object} excelStyle - 엑셀 스타일 설정
 * @param {Object} excelStyle.header - 헤더 스타일
 * @param {Object} excelStyle.body - 데이터 스타일
 */
function applySheetStyle(sheet, data, excelStyle, startRow = 1) {
  if (!sheet || !data || data.length === 0) return;

  const columns = Object.keys(data[0]);
  
  // 컬럼 너비 설정
  let colwidths = excelStyle.header?.colwidths;
  if (colwidths && typeof colwidths === 'object') {
    const calculatedWidths = calculateColumnWidths(columns, data, {
      min: colwidths.min ? Number(colwidths.min) : 10,
      max: colwidths.max ? Number(colwidths.max) : 30
    });
    
    sheet.columns = columns.map((key, i) => ({
      header: key,
      key,
      width: calculatedWidths[i]
    }));
  } else {
    // 기본 컬럼 설정
    sheet.columns = columns.map(key => ({ header: key, key }));
  }

  // 헤더 행 추가 (startRow 위치에)
  const headerRow = sheet.getRow(startRow);
  columns.forEach((col, index) => {
    headerRow.getCell(index + 1).value = col;
  });

  // 데이터 행 추가 (startRow + 1부터)
  data.forEach((row, rowIndex) => {
    const dataRow = sheet.getRow(startRow + 1 + rowIndex);
    columns.forEach((col, colIndex) => {
      dataRow.getCell(colIndex + 1).value = row[col];
    });
  });

  // 헤더 스타일 적용 (startRow에 적용)
  if (excelStyle.header) {
    applyHeaderStyleAtRow(sheet, columns, excelStyle.header, startRow);
  }

  // 데이터 스타일 적용 (startRow + 1부터)
  if (excelStyle.body) {
    applyBodyStyleAtRow(sheet, columns, data.length, excelStyle.body, startRow + 1);
  }
}

/**
 * 목차 시트 생성 및 스타일 적용
 * @param {Object} workbook - ExcelJS 워크북 객체
 * @param {Array} sheetNames - 시트명 배열
 * @returns {Object} 생성된 목차 시트
 */
function createTableOfContents(workbook, sheetNames) {
  const tocSheet = workbook.addWorksheet(msg.tableOfContents);
  
  // 헤더 추가
  tocSheet.addRow(['No', msg.sheetName, msg.records, 'Note']);
  
  // 시트 목록 추가
  sheetNames.forEach((obj, idx) => {
    // 시트명이 잘렸는지 확인
    const isTruncated = obj.originalName && obj.originalName !== obj.tabName;
    const noteText = isTruncated ? msg.truncatedNote : '';
    
    const row = tocSheet.addRow([idx + 1, obj.displayName, obj.recordCount || 0, noteText]);
    
    // 하이퍼링크 설정 - 실제 시트명(tabName) 사용
    const sheetNameForLink = obj.tabName.replace(/'/g, "''"); // 작은따옴표 이스케이프
    const displayNameForFormula = obj.displayName.replace(/"/g, '""'); // 큰따옴표 이스케이프
    
    // HYPERLINK 함수를 사용한 내부 링크 (실제 시트명으로 링크)
    const hyperlinkFormula = `HYPERLINK("#'${sheetNameForLink}'!A1","${displayNameForFormula}")`;
    
    try {
      row.getCell(2).value = { formula: hyperlinkFormula };
      row.getCell(2).font = { 
        color: { argb: '0563C1' }, 
        underline: true 
      };
    } catch (error) {
      // HYPERLINK 함수 실패 시 직접 하이퍼링크 방식 시도
      try {
        row.getCell(2).value = {
          text: obj.displayName,
          hyperlink: `#'${sheetNameForLink}'!A1`
        };
        row.getCell(2).font = { 
          color: { argb: '0563C1' }, 
          underline: true 
        };
      } catch (error2) {
        // 모든 방법 실패 시 일반 텍스트로 표시
        row.getCell(2).value = obj.displayName;
        row.getCell(2).font = { 
          color: { argb: '0563C1' } 
        };
        console.warn(`${msg.hyperlinkFailed} ${obj.displayName}`);
      }
    }
    
    // 데이터 건수 스타일링
    const recordCountCell = row.getCell(3);
    recordCountCell.numFmt = '#,##0'; // 천 단위 구분자
    recordCountCell.alignment = { horizontal: 'right' };
    recordCountCell.font = { 
      color: obj.recordCount > 0 ? { argb: '2F5597' } : { argb: '999999' } 
    };
    
    // 비고 컬럼 스타일링
    if (isTruncated) {
      row.getCell(4).font = { 
        italic: true,
        color: { argb: 'D2691E' } // 주황색으로 경고 표시
      };
      
      // 원본 시트명을 셀 주석으로 추가
      row.getCell(2).note = {
        texts: [
          { text: msg.originalSheetName, font: { bold: true } },
          { text: obj.originalName, font: { italic: true } },
          { text: msg.actualTabName, font: { bold: true } },
          { text: obj.tabName, font: { color: { argb: 'FF0000' } } },
          { text: msg.sheetNameLimit, font: { size: 9, color: { argb: '666666' } } }
        ]
      };
    }
  });

  // 컬럼 설정
  tocSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: msg.sheetName, key: 'name', width: 25 },
    { header: msg.records, key: 'records', width: 12 },
    { header: 'Aggregate Info', key: 'aggregate', width: 35 },
    { header: 'Note', key: 'note', width: 18 }
  ];

  // 헤더 스타일
  const headerRow = tocSheet.getRow(1);
  headerRow.font = { bold: true };
  
  // 헤더 배경색
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E7E6E6' }
  };

  // 시트 탭을 맨 왼쪽에 위치하도록 설정
  tocSheet.state = 'visible';
  tocSheet.properties.tabColor = { argb: 'FF4472C4' }; // 파란색 탭으로 구분

  return tocSheet;
}

/**
 * 기존 목차 시트에 내용을 채우는 함수 (시트는 이미 생성된 상태)
 * @param {Object} tocSheet - 이미 생성된 목차 시트 객체
 * @param {Array} sheetNames - 시트명 배열
 */
function populateTableOfContents(tocSheet, sheetNames) {
  // 기존 내용 모두 삭제
  tocSheet.spliceRows(1, tocSheet.rowCount);
  
  // 헤더 추가 (원본 시트명/쿼리문 컬럼 포함, Note 제거)
  tocSheet.addRow(['No', msg.sheetName, 'Original Name', msg.records, 'Aggregate Info', 'Query']);
  
  // 시트 목록 추가
  sheetNames.forEach((obj, idx) => {
    // 집계 정보 텍스트 생성 (템플릿 사용)
    let aggregateInfo = '';
    
    if (obj.aggregateInfoTemplate) {
      // 템플릿이 지정된 경우 템플릿 사용
      aggregateInfo = obj.aggregateInfoTemplate;
      
      // 템플릿 변수 치환
      aggregateInfo = aggregateInfo.replace(/{count}/g, obj.recordCount || 0);
      aggregateInfo = aggregateInfo.replace(/{total}/g, obj.recordCount || 0);
      
      // 집계 데이터가 있는 경우 추가 변수 치환
      if (obj.aggregateColumn && obj.aggregateData && obj.aggregateData.length > 0) {
        const topItems = obj.aggregateData.slice(0, 4); // 상위 4개만 표시
        const detailInfo = `(${topItems.map(item => `${item.key}:${item.count}`).join(', ')}`;
        const finalDetailInfo = obj.aggregateData.length > 4 
          ? detailInfo + ` and ${obj.aggregateData.length - 4} others)`
          : detailInfo + ')';
        
        aggregateInfo = aggregateInfo.replace(/{details}/g, finalDetailInfo);
        aggregateInfo = aggregateInfo.replace(/{column}/g, obj.aggregateColumn);
        
        // 최다 항목 정보
        if (obj.aggregateData.length > 0) {
          aggregateInfo = aggregateInfo.replace(/{top_item}/g, obj.aggregateData[0].key);
          aggregateInfo = aggregateInfo.replace(/{top_count}/g, obj.aggregateData[0].count);
        }
      } else {
        // 집계 데이터가 없는 경우 빈 문자열로 치환
        aggregateInfo = aggregateInfo.replace(/{details}/g, '');
        aggregateInfo = aggregateInfo.replace(/{column}/g, '');
        aggregateInfo = aggregateInfo.replace(/{top_item}/g, '');
        aggregateInfo = aggregateInfo.replace(/{top_count}/g, '');
      }
    } else {
      // 기본 템플릿 사용 (기존 로직)
      if (obj.aggregateColumn && obj.aggregateData && obj.aggregateData.length > 0) {
        const topItems = obj.aggregateData.slice(0, 4); // 상위 4개만 표시
        const detailInfo = `(${topItems.map(item => `${item.key}:${item.count}`).join(', ')}`;
        const finalDetailInfo = obj.aggregateData.length > 4 
          ? detailInfo + ` ${msg.and} ${obj.aggregateData.length - 4} ${msg.others})`
          : detailInfo + ')';
        aggregateInfo = `${msg.selectedDataRows} ${obj.recordCount} ${msg.rows} ${finalDetailInfo}`;
      } else {
        aggregateInfo = `${msg.selectedDataRows} ${obj.recordCount} ${msg.rows}`;
      }
    }
    
    // 쿼리문 정보 추출 (최대 10000자로 제한, 원래 형식 유지)
    let queryText = '';
    if (obj.query) {
      queryText = obj.query.trim(); // 앞뒤 공백만 제거, 줄바꿈과 들여쓰기 유지
      if (queryText.length > 10000) {
        queryText = queryText.substring(0, 10000) + msg.omittedMaxChars;
      }
    }
    
    const row = tocSheet.addRow([
      idx + 1,
      obj.displayName,
      obj.originalName || '',
      obj.recordCount || 0,
      aggregateInfo,
      queryText
    ]);
    
    // 하이퍼링크 설정 - 실제 시트명(tabName) 사용
    const sheetNameForLink = obj.tabName.replace(/'/g, "''"); // 작은따옴표 이스케이프
    const displayNameForFormula = obj.displayName.replace(/"/g, '""'); // 큰따옴표 이스케이프
    
    // HYPERLINK 함수를 사용한 내부 링크 (실제 시트명으로 링크)
    const hyperlinkFormula = `HYPERLINK("#'${sheetNameForLink}'!A1","${displayNameForFormula}")`;
    
    try {
      row.getCell(2).value = { formula: hyperlinkFormula };
      row.getCell(2).font = { 
        color: { argb: '0563C1' }, 
        underline: true 
      };
    } catch (error) {
      // HYPERLINK 함수 실패 시 직접 하이퍼링크 방식 시도
      try {
        row.getCell(2).value = {
          text: obj.displayName,
          hyperlink: `#'${sheetNameForLink}'!A1`
        };
        row.getCell(2).font = { 
          color: { argb: '0563C1' }, 
          underline: true 
        };
      } catch (error2) {
        // 모든 방법 실패 시 일반 텍스트로 표시
        row.getCell(2).value = obj.displayName;
        row.getCell(2).font = { 
          color: { argb: '0563C1' } 
        };
        console.warn(`${msg.hyperlinkFailed} ${obj.displayName}`);
      }
    }
    
    // 데이터 건수 스타일링 및 하이퍼링크 (이제 4번째 컬럼)
    const recordCountCell = row.getCell(4);
    const recordCountText = (obj.recordCount || 0).toString();
    
    // 데이터 건수에도 하이퍼링크 적용
    const recordCountFormula = `HYPERLINK("#'${sheetNameForLink}'!A1","${recordCountText}")`;
    
    try {
      recordCountCell.value = { formula: recordCountFormula };
      recordCountCell.font = { 
        color: { argb: '0563C1' }, 
        underline: true 
      };
    } catch (error) {
      // HYPERLINK 함수 실패 시 직접 하이퍼링크 방식 시도
      try {
        recordCountCell.value = {
          text: recordCountText,
          hyperlink: `#'${sheetNameForLink}'!A1`
        };
        recordCountCell.font = { 
          color: { argb: '0563C1' }, 
          underline: true 
        };
      } catch (error2) {
        // 모든 방법 실패 시 일반 텍스트로 표시
        recordCountCell.value = obj.recordCount || 0;
        recordCountCell.font = { 
          color: obj.recordCount > 0 ? { argb: '2F5597' } : { argb: '999999' } 
        };
      }
    }
    
    recordCountCell.numFmt = '#,##0'; // 천 단위 구분자
    recordCountCell.alignment = { horizontal: 'right' };
    
    // 집계 데이터 컬럼에 하이퍼링크 적용 (이제 5번째 컬럼)
    const aggregateCell = row.getCell(5);
    if (aggregateInfo) {
      // 집계 정보에도 하이퍼링크 적용
      const aggregateFormula = `HYPERLINK("#'${sheetNameForLink}'!A1","${aggregateInfo.replace(/"/g, '""')}")`;
      
      try {
        aggregateCell.value = { formula: aggregateFormula };
        aggregateCell.font = { 
          color: { argb: '0563C1' }, 
          underline: true 
        };
      } catch (error) {
        // HYPERLINK 함수 실패 시 직접 하이퍼링크 방식 시도
        try {
          aggregateCell.value = {
            text: aggregateInfo,
            hyperlink: `#'${sheetNameForLink}'!A1`
          };
          aggregateCell.font = { 
            color: { argb: '0563C1' }, 
            underline: true 
          };
        } catch (error2) {
          // 모든 방법 실패 시 일반 텍스트로 표시
          aggregateCell.value = aggregateInfo;
          aggregateCell.font = { 
            color: { argb: '2F5597' }
          };
        }
      }
      
      // 집계 데이터 스타일링
      aggregateCell.alignment = { horizontal: 'left', vertical: 'middle' };
      aggregateCell.font = { 
        ...aggregateCell.font,
        size: 10
      };
    } else {
      // 집계 데이터가 없는 경우
      aggregateCell.value = '';
      aggregateCell.font = { color: { argb: '999999' } };
    }
    
    // 쿼리문 컬럼 스타일링 (이제 6번째 컬럼)
    const queryCell = row.getCell(6);
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
    } else {
      queryCell.value = '';
      queryCell.font = { color: { argb: '999999' } };
    }
  });

  // 컬럼 설정 (Original Name 추가, Note 제거)
  tocSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: msg.sheetName, key: 'name', width: 25 },
    { header: 'Original Name', key: 'original', width: 25 },
    { header: msg.records, key: 'records', width: 12 },
    { header: 'Aggregate Info', key: 'aggregate', width: 20 },
    { header: 'Query', key: 'query', width: 40 }
  ];

  // 헤더 스타일
  const headerRow = tocSheet.getRow(1);
  headerRow.font = { bold: true };
  
  // 헤더 배경색
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E7E6E6' }
  };

  // 시트 탭을 맨 왼쪽에 위치하도록 설정
  tocSheet.state = 'visible';
  tocSheet.properties.tabColor = { argb: 'FF4472C4' }; // 파란색 탭으로 구분
}

/**
 * 별도 파일용 목차 시트 생성 (외부 파일 링크 사용)
 * @param {Object} workbook - ExcelJS 워크북 객체
 * @param {Array} sheetNames - 시트명 배열
 * @param {string} targetFileName - 대상 엑셀 파일명
 * @returns {Object} 생성된 목차 시트
 */
function createExternalTableOfContents(workbook, sheetNames, targetFileName) {
  const tocSheet = workbook.addWorksheet(msg.tableOfContents);
  
  // 제목 및 안내사항 추가
  const titleRow = tocSheet.addRow([msg.excelToc]);
  titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: '2F5597' } };
  tocSheet.mergeCells(1, 1, 1, 4);
  
  tocSheet.addRow([]);
  
  const fileInfoRow = tocSheet.addRow([msg.targetFile, path.basename(targetFileName)]);
  fileInfoRow.getCell(1).font = { bold: true };
  fileInfoRow.getCell(2).font = { color: { argb: '0563C1' } };
  
  tocSheet.addRow([]);
  
  // 헤더 추가
  const headerRow = tocSheet.addRow(['No', msg.sheetName, msg.records, msg.description, msg.fileLink]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D9E2F3' }
  };
  
  // 시트 목록 추가
  sheetNames.forEach((obj, idx) => {
    const row = tocSheet.addRow([
      idx + 1, 
      obj.displayName, 
      obj.recordCount || 0,
      `${obj.displayName} ${msg.checkSheetData}`, 
      msg.openFile
    ]);
    
    // 시트명 스타일링
    row.getCell(2).font = { 
      bold: true,
      color: { argb: '2F5597' }
    };
    
    // 데이터 건수 스타일링
    const recordCountCell = row.getCell(3);
    recordCountCell.numFmt = '#,##0'; // 천 단위 구분자
    recordCountCell.alignment = { horizontal: 'right' };
    recordCountCell.font = { 
      color: obj.recordCount > 0 ? { argb: '2F5597' } : { argb: '999999' } 
    };
    
    // 설명 스타일링
    row.getCell(4).font = { 
      italic: true,
      color: { argb: '666666' }
    };
    
    // 외부 파일 링크 설정
    try {
      row.getCell(5).value = {
        text: msg.openFile,
        hyperlink: targetFileName
      };
      row.getCell(5).font = { 
        color: { argb: '0563C1' }, 
        underline: true 
      };
    } catch (error) {
      row.getCell(5).value = msg.openFileText;
      row.getCell(5).font = { 
        color: { argb: '666666' } 
      };
    }
  });

  // 컬럼 설정
  tocSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: msg.sheetName, key: 'name', width: 20 },
    { header: msg.records, key: 'records', width: 10 },
    { header: msg.description, key: 'desc', width: 30 },
    { header: msg.fileLink, key: 'link', width: 15 }
  ];

  // 사용법 안내 추가
  tocSheet.addRow([]);
  tocSheet.addRow([]);
  const usageRow1 = tocSheet.addRow([msg.usage]);
  usageRow1.getCell(1).font = { bold: true, color: { argb: '2F5597' } };
  
  tocSheet.addRow([msg.usageStep1]);
  tocSheet.addRow([msg.usageStep2]);
  tocSheet.addRow([msg.usageStep3]);
  
  // 안내 메시지 스타일링
  for (let i = tocSheet.rowCount - 2; i <= tocSheet.rowCount; i++) {
    const row = tocSheet.getRow(i);
    row.getCell(1).font = { color: { argb: '666666' } };
  }

  return tocSheet;
}

module.exports = {
  parseBorder,
  parseFont,
  parseFill,
  parseAlignment,
  applyCellStyle,
  applyHeaderStyle,
  applyBodyStyle,
  calculateColumnWidths,
  applySheetStyle,
  createTableOfContents,
  populateTableOfContents,
  createExternalTableOfContents
}; 