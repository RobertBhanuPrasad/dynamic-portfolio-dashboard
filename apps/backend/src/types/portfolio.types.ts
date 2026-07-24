export interface SectorResponse {
  id: string;
  name: string;
}

export interface MarketDataCoverage {
  totalHoldings: number;
  pricedHoldings: number;
  unavailableHoldings: number;
}

export interface SectorSummaryResponse {
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  marketDataCoverage: MarketDataCoverage;
}

export interface PortfolioSummaryResponse {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  marketDataCoverage: MarketDataCoverage;
}

export interface HoldingResponse {
  id: string;
  ticker: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  sector: SectorResponse;
  
  // Calculations
  investment: number;
  portfolioPercentage: number;
  
  // Market Data (CMP)
  currentMarketPrice: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercentage: number | null;
  marketDataError: string | null;

  // Fundamentals
  peRatio: number | null;
  latestEarnings: string | null;
  fundamentalsError: string | null;
}

export interface SectorGroupResponse {
  sector: SectorResponse;
  summary: SectorSummaryResponse;
  holdings: HoldingResponse[];
}

export interface PortfolioResponse {
  id: string;
  name: string;
  createdAt: string;
  summary: PortfolioSummaryResponse;
  sectors: SectorGroupResponse[];
}
