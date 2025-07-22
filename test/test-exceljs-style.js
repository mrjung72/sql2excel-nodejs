const ExcelJS = require('exceljs');

(async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test');
  ws.columns = [
    { header: 'A', key: 'a', width: 15 },
    { header: 'B', key: 'b', width: 15 }
  ];
  ws.addRow(['Centered', 'Bordered']);
  ws.addRow(['Data1', 'Data2']);

  // 헤더 셀 스타일
  ws.getRow(1).getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).getCell(1).border = {
    top:    { style: 'thin', color: { argb: 'FF0000' } },
    left:   { style: 'thin', color: { argb: 'FF0000' } },
    right:  { style: 'thin', color: { argb: 'FF0000' } },
    bottom: { style: 'thin', color: { argb: 'FF0000' } }
  };
  ws.getRow(1).getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).getCell(2).border = {
    top:    { style: 'thick', color: { argb: '0000FF' } },
    left:   { style: 'thick', color: { argb: '0000FF' } },
    right:  { style: 'thick', color: { argb: '0000FF' } },
    bottom: { style: 'thick', color: { argb: '0000FF' } }
  };

  // 데이터 셀 스타일
  ws.getRow(2).getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).getCell(1).border = {
    top:    { style: 'thin', color: { argb: '00FF00' } },
    left:   { style: 'thin', color: { argb: '00FF00' } },
    right:  { style: 'thin', color: { argb: '00FF00' } },
    bottom: { style: 'thin', color: { argb: '00FF00' } }
  };
  ws.getRow(2).getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).getCell(2).border = {
    top:    { style: 'dashed', color: { argb: '000000' } },
    left:   { style: 'dashed', color: { argb: '000000' } },
    right:  { style: 'dashed', color: { argb: '000000' } },
    bottom: { style: 'dashed', color: { argb: '000000' } }
  };

  await wb.xlsx.writeFile('test-exceljs-style.xlsx');
  console.log('test-exceljs-style.xlsx 파일이 생성되었습니다.');
})(); 