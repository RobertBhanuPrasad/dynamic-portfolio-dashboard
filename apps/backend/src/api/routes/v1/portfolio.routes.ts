import { Router } from 'express';
import { portfolioController } from '../../controllers/portfolio.controller';

const router = Router();

router.get('/', portfolioController.getPortfolios);
router.get('/:portfolioId', portfolioController.getPortfolioById);
router.get('/:portfolioId/holdings', portfolioController.getPortfolioHoldings);

export { router as portfolioRoutes };
