import { RawRow, RowType, ClassifyResult } from './types';

export class RowClassifier {
  private hasPassedActivePortfolio = false;

  public classify(row: RawRow): ClassifyResult {
    const d = row.data;

    // 1. Check for blank row
    if (!d || d.length === 0 || d.every(cell => cell === undefined || cell === null || cell === '')) {
      return { type: RowType.BLANK, row };
    }

    // 2. Check for Portfolio Total (Row 35: [empty, empty, empty, empty, '1543060', ...])
    // Or check if "Sold Price" header appears
    if (d[32] === 'Sold Price' || (d[0] === undefined && d[1] === undefined && d[4] !== undefined && !isNaN(Number(d[4].replace(/,/g, ''))))) {
      // If we see the total or the sold header, we are leaving the active portfolio.
      // Let's be specific for the total row: 4 empty items then a number
      if (d[0] === undefined && d[1] === undefined && d[4] !== undefined) {
        this.hasPassedActivePortfolio = true;
        return { type: RowType.PORTFOLIO_TOTAL, row };
      }
    }

    // Check if we reached the Sold Section explicit header
    if (d.includes('Sold Price')) {
      this.hasPassedActivePortfolio = true;
      return { type: RowType.BLANK, row }; // Treat the header itself as a blank/ignored row
    }

    // 3. Check for Holding (Active or Sold)
    // A holding row usually has a number in column 0 (S.No.)
    const isSerialNumber = d[0] !== undefined && !isNaN(Number(d[0])) && String(d[0]).trim() !== '';
    if (isSerialNumber && d[1] !== undefined && d[2] !== undefined && d[3] !== undefined) {
      if (this.hasPassedActivePortfolio) {
        return { type: RowType.SOLD_HOLDING, row };
      } else {
        return { type: RowType.ACTIVE_HOLDING, row };
      }
    }

    // 4. Check for Sector Header
    // Sector headers have empty col 0, text in col 1, and usually some totals in col 4.
    if ((d[0] === undefined || String(d[0]).trim() === '') && d[1] !== undefined && String(d[1]).trim() !== '') {
      if (!this.hasPassedActivePortfolio) {
        return { type: RowType.SECTOR_HEADER, row };
      }
    }

    return { type: RowType.UNKNOWN, row };
  }
}
