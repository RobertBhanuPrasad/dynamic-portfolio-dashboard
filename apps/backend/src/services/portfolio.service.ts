import { portfolioRepository } from '../core/repositories/portfolio.repository';
import { NotFoundError } from '../core/errors/AppError';
import { decimalToNumber } from '../utils/serialization';
import { PortfolioResponse, HoldingResponse } from '../types/portfolio.types';
import { marketDataService } from './market-data/market-data.service';

export class PortfolioService {
  async getPortfolios(): Promise<PortfolioResponse[]> {
    const portfolios = await portfolioRepository.findAll();

    const response = [];
    for (const portfolio of portfolios) {
      response.push({
        id: portfolio.id,
        name: portfolio.name,
        createdAt: portfolio.createdAt.toISOString(),
        holdings: await this.enrichHoldingsWithMarketData(portfolio.holdings),
      });
    }
    
    return response;
  }

  async getPortfolioById(portfolioId: string): Promise<PortfolioResponse> {
    const portfolio = await portfolioRepository.findById(portfolioId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio not found');
    }

    return {
      id: portfolio.id,
      name: portfolio.name,
      createdAt: portfolio.createdAt.toISOString(),
      holdings: await this.enrichHoldingsWithMarketData(portfolio.holdings),
    };
  }

  async getPortfolioHoldings(portfolioId: string): Promise<HoldingResponse[]> {
    const holdings = await portfolioRepository.findHoldingsByPortfolioId(portfolioId);
    return this.enrichHoldingsWithMarketData(holdings);
  }

  private async enrichHoldingsWithMarketData(holdings: any[]): Promise<HoldingResponse[]> {
    if (holdings.length === 0) return [];

    const identifiers = holdings.map(h => ({ ticker: h.ticker, exchange: h.exchange }));
    const quotes = await marketDataService.getQuotes(identifiers);

    return holdings.map((h) => {
      const quote = quotes.get(h.ticker);
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
      };
    });
  }
}

export const portfolioService = new PortfolioService();
