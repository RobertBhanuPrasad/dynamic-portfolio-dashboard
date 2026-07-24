// Based on the verified backend response

export interface MarketDataCoverage {
  totalHoldings: number;
  pricedHoldings: number;
  unavailableHoldings: number;
}

export interface Sector {
  id: string;
  name: string;
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  marketDataCoverage: MarketDataCoverage;
}

export interface Holding {
  id: string;
  ticker: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  sector: Sector;
  investment: number;
  portfolioPercentage: number;
  currentMarketPrice: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercentage: number | null;
  marketDataError: string | null;
  peRatio: number | null;
  latestEarnings: string | null;
  fundamentalsError: string | null;
}

export interface SectorSummary {
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  marketDataCoverage: MarketDataCoverage;
}

export interface SectorGroup {
  sector: Sector;
  holdings: Holding[];
  summary: SectorSummary;
}

export interface Portfolio {
  id: string;
  name: string;
  createdAt: string;
  summary: PortfolioSummary;
  sectors: SectorGroup[];
}

export interface PortfolioApiResponse {
  success: boolean;
  data: Portfolio[];
}
