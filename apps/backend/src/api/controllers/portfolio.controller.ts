import { Request, Response } from 'express';
import { z } from 'zod';
import { portfolioService } from '../../services/portfolio.service';
import { ValidationError } from '../../core/errors/AppError';

// Zod schema for validating UUID params
const uuidParamSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID format'),
});

export class PortfolioController {
  async getPortfolios(req: Request, res: Response) {
    const portfolios = await portfolioService.getPortfolios();
    res.status(200).json({ success: true, data: portfolios });
  }

  async getPortfolioById(req: Request, res: Response) {
    const parseResult = uuidParamSchema.safeParse(req.params);
    
    if (!parseResult.success) {
      throw new ValidationError('Invalid portfolio ID format');
    }

    const { portfolioId } = parseResult.data;
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    
    res.status(200).json({ success: true, data: portfolio });
  }

  async getPortfolioHoldings(req: Request, res: Response) {
    const parseResult = uuidParamSchema.safeParse(req.params);
    
    if (!parseResult.success) {
      throw new ValidationError('Invalid portfolio ID format');
    }

    const { portfolioId } = parseResult.data;
    // ensure portfolio exists first
    await portfolioService.getPortfolioById(portfolioId); 
    
    const holdings = await portfolioService.getPortfolioHoldings(portfolioId);
    res.status(200).json({ success: true, data: holdings });
  }
}

export const portfolioController = new PortfolioController();
