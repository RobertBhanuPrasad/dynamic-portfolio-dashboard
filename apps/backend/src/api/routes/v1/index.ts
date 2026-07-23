import { Router, Request, Response } from 'express';
import { prisma } from '../../../db/prisma';
import { portfolioRoutes } from './portfolio.routes';

const router = Router();

router.use('/portfolios', portfolioRoutes);

router.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  res.status(200).json({
    status: 'ok',
    service: 'dynamic-portfolio-dashboard-backend',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export { router as v1Router };
