import 'express-async-errors'; // Handles async errors globally
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { config } from './config/env';
import { logger } from './utils/logger';
import { v1Router } from './api/routes/v1';
import { errorHandler } from './api/middlewares/error-handler';
import { NotFoundError } from './core/errors/AppError';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health', // Don't spam health checks
    },
  })
);

// Routes
app.use('/api/v1', v1Router);

// Unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Error handling
app.use(errorHandler);

export { app };
