import { portfolioRepository } from '../core/repositories/portfolio.repository';
import { NotFoundError } from '../core/errors/AppError';
import { decimalToNumber } from '../utils/serialization';
import { PortfolioResponse, HoldingResponse } from '../types/portfolio.types';

export class PortfolioService {
  async getPortfolios(): Promise<PortfolioResponse[]> {
    const portfolios = await portfolioRepository.findAll();

    return portfolios.map((portfolio) => ({
      id: portfolio.id,
      name: portfolio.name,
      createdAt: portfolio.createdAt.toISOString(),
      holdings: portfolio.holdings.map((h) => ({
        id: h.id,
        ticker: h.ticker,
        companyName: h.companyName,
        quantity: decimalToNumber(h.quantity),
        purchasePrice: decimalToNumber(h.purchasePrice),
        sector: {
          id: h.sector.id,
          name: h.sector.name,
        },
      })),
    }));
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
      holdings: portfolio.holdings.map((h) => ({
        id: h.id,
        ticker: h.ticker,
        companyName: h.companyName,
        quantity: decimalToNumber(h.quantity),
        purchasePrice: decimalToNumber(h.purchasePrice),
        sector: {
          id: h.sector.id,
          name: h.sector.name,
        },
      })),
    };
  }

  async getPortfolioHoldings(portfolioId: string): Promise<HoldingResponse[]> {
    const holdings = await portfolioRepository.findHoldingsByPortfolioId(portfolioId);
    return holdings.map((h) => ({
      id: h.id,
      ticker: h.ticker,
      companyName: h.companyName,
      quantity: decimalToNumber(h.quantity),
      purchasePrice: decimalToNumber(h.purchasePrice),
      sector: {
        id: h.sector.id,
        name: h.sector.name,
      },
    }));
  }
}

export const portfolioService = new PortfolioService();
