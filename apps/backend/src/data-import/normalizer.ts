import { RawRow, NormalizedHolding } from './types';

export class Normalizer {
  private currentSector: string = 'Others';

  public setCurrentSector(rawSector: string) {
    const s = rawSector.trim().toLowerCase();
    if (s.includes('financial')) this.currentSector = 'Financial';
    else if (s.includes('tech')) this.currentSector = 'Technology';
    else if (s.includes('consumer')) this.currentSector = 'Consumer';
    else if (s.includes('power')) this.currentSector = 'Power';
    else if (s.includes('pipe')) this.currentSector = 'Pipes';
    else this.currentSector = 'Others';
  }

  public normalizeActiveHolding(row: RawRow): NormalizedHolding {
    const d = row.data;

    const companyName = String(d[1]).trim().replace(/\s+/g, ' ');
    
    // Parse numbers, remove commas if any
    const purchasePriceStr = String(d[2]).replace(/,/g, '');
    const quantityStr = String(d[3]).replace(/,/g, '');

    const purchasePrice = parseFloat(purchasePriceStr);
    const quantity = parseFloat(quantityStr);

    const rawIdentifier = String(d[6]).trim();
    
    // Check if identifier is strictly numeric
    const isNumericCode = /^\d+$/.test(rawIdentifier);
    
    return {
      sourceRowNumber: row.rowNumber,
      companyName,
      purchasePrice,
      quantity,
      sector: this.currentSector,
      securityIdentifier: rawIdentifier,
      securityIdentifierType: isNumericCode ? 'BSE_CODE' : 'TICKER',
      exchange: isNumericCode ? 'BSE' : 'NSE'
    };
  }
}
