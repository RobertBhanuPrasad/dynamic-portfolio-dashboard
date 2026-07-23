import * as xlsx from 'xlsx';
import * as path from 'path';
const filePath = path.resolve(__dirname, '../../../../data/source/302ABB36.xlsx');
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
for (let i = 0; i < 50; i++) {
  console.log(`Row ${i + 1}:`, rawData[i]);
}
