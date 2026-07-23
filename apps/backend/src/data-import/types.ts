export enum RowType {
  SECTOR_HEADER = 'SECTOR_HEADER',
  ACTIVE_HOLDING = 'ACTIVE_HOLDING',
  PORTFOLIO_TOTAL = 'PORTFOLIO_TOTAL',
  SOLD_HOLDING = 'SOLD_HOLDING',
  BLANK = 'BLANK',
  UNKNOWN = 'UNKNOWN',
}

export interface RawRow {
  rowNumber: number;
  data: any[];
}

export interface ClassifyResult {
  type: RowType;
  row: RawRow;
}

export interface NormalizedHolding {
  sourceRowNumber: number;
  companyName: string;
  purchasePrice: number;
  quantity: number;
  sector: string;
  securityIdentifier: string;
  securityIdentifierType: 'TICKER' | 'BSE_CODE';
  exchange: 'NSE' | 'BSE';
}

export interface InvalidHolding {
  sourceRowNumber: number;
  companyName?: string;
  field: string;
  category: string;
  reason: string;
}

export interface ImportSummary {
  worksheetSelected: string;
  rowsScanned: number;
  sectorHeadersFound: number;
  activeHoldingsFound: number;
  soldHoldingsFound: number;
  blankRows: number;
  unknownRows: number;
  invalidActiveRows: InvalidHolding[];
  calculatedActiveInvestmentTotal: number;
  spreadsheetReportedTotal: number;
}
