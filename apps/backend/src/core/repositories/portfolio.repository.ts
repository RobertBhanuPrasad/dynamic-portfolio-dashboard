import { prisma } from '../../db/prisma';

export class PortfolioRepository {
  async findAll() {
    return prisma.portfolio.findMany({
      include: {
        holdings: {
          include: {
            sector: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(portfolioId: string) {
    return prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        holdings: {
          include: {
            sector: true,
          },
        },
      },
    });
  }

  async findHoldingsByPortfolioId(portfolioId: string) {
    return prisma.holding.findMany({
      where: { portfolioId },
      include: { sector: true },
    });
  }
}

export const portfolioRepository = new PortfolioRepository();
