import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/AppError';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, 'Operational error');
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Unexpected errors
  logger.error({ err }, 'Unexpected error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
