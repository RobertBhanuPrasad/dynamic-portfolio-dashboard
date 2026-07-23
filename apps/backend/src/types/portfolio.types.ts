export interface SectorResponse {
  id: string;
  name: string;
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  sector: SectorResponse;
  currentMarketPrice?: number | null;
  marketDataError?: string | null;
  peRatio?: number | null;
  latestEarnings?: string | null;
  fundamentalsError?: string | null;
}

export interface PortfolioResponse {
  id: string;
  name: string;
  createdAt: string;
  holdings?: HoldingResponse[];
}
