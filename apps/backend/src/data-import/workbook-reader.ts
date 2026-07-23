import * as xlsx from 'xlsx';
import * as path from 'path';
import { RawRow } from './types';

export class WorkbookReader {
  public sheetName: string = '';

  public readRows(filePath: string): RawRow[] {
    const absolutePath = path.resolve(filePath);
    const workbook = xlsx.readFile(absolutePath);
    
    if (workbook.SheetNames.length === 0) {
      throw new Error('Workbook contains no sheets');
    }

    this.sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[this.sheetName];
    
    // Read raw 2D array, ensuring empty cells are represented properly
    const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    // Skip the first row if it's the header. We know row 0 is headers.
    const rows: RawRow[] = [];
    for (let i = 1; i < rawData.length; i++) {
      rows.push({
        rowNumber: i + 1, // Excel row number (1-based, plus 1 because array is 0-indexed) -> wait array index 1 is row 2
        data: rawData[i],
      });
    }

    return rows;
  }
}
