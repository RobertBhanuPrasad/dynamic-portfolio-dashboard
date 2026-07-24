import { portfolioRepository } from '../core/repositories/portfolio.repository';
import { NotFoundError } from '../core/errors/AppError';
import { decimalToNumber } from '../utils/serialization';
import { PortfolioResponse } from '../types/portfolio.types';
import { marketDataService } from './market-data/market-data.service';
import { PortfolioCalculator } from '../core/calculators/portfolio.calculator';

export class PortfolioService {
  async getPortfolios(): Promise<PortfolioResponse[]> {
    const portfolios = await portfolioRepository.findAll();

    const response = [];
    for (const portfolio of portfolios) {
      const calculated = await this.enrichAndCalculate(portfolio.holdings);
      response.push({
        id: portfolio.id,
        name: portfolio.name,
        createdAt: portfolio.createdAt.toISOString(),
        summary: calculated.summary,
        sectors: calculated.sectors,
      });
    }
    
    return response;
  }

  async getPortfolioById(portfolioId: string): Promise<PortfolioResponse> {
    const portfolio = await portfolioRepository.findById(portfolioId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    const calculated = await this.enrichAndCalculate(portfolio.holdings);

    return {
      id: portfolio.id,
      name: portfolio.name,
      createdAt: portfolio.createdAt.toISOString(),
      summary: calculated.summary,
      sectors: calculated.sectors,
    };
  }

  async getPortfolioHoldings(portfolioId: string): Promise<any[]> {
    const portfolio = await portfolioRepository.findById(portfolioId);
    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }
    const calculated = await this.enrichAndCalculate(portfolio.holdings);
    
    // Flatten sectors to return a flat list of holding responses
    const holdings = [];
    for (const group of calculated.sectors) {
      holdings.push(...group.holdings);
    }
    return holdings;
  }

  private async enrichAndCalculate(holdings: any[]) {
    if (holdings.length === 0) {
      return {
        summary: {
          totalInvestment: 0,
          totalPresentValue: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          marketDataCoverage: { totalHoldings: 0, pricedHoldings: 0, unavailableHoldings: 0 },
        },
        sectors: []
      };
    }

    const identifiers = holdings.map(h => ({ ticker: h.ticker, exchange: h.exchange }));
    
    const [quotes, fundamentals] = await Promise.all([
      marketDataService.getQuotes(identifiers),
      marketDataService.getFundamentalsBatch(identifiers)
    ]);

    const rawEnrichedHoldings = holdings.map((h) => {
      const quote = quotes.get(h.ticker);
      const fundamental = fundamentals.get(h.ticker);
      
      return {
        id: h.id,
        ticker: h.ticker,
        companyName: h.companyName,
        quantity: decimalToNumber(h.quantity),
        purchasePrice: decimalToNumber(h.purchasePrice),
        sector: {
          id: h.sector.id,
          name: h.sector.name,
        },
        currentMarketPrice: quote?.price ?? null,
        marketDataError: quote?.errorCategory ?? null,
        peRatio: fundamental?.peRatio ?? null,
        latestEarnings: fundamental?.latestEarnings ?? null,
        fundamentalsError: fundamental?.errorCategory ?? null,
      };
    });

    // Run the deterministic calculation engine
    return PortfolioCalculator.processPortfolio(rawEnrichedHoldings);
  }
}
export const portfolioService = new PortfolioService();
