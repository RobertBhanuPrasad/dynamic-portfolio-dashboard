import { app } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server closure');
    } else {
      logger.info('HTTP server closed.');
    }
    
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      process.exit(0);
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error during Prisma disconnection');
      process.exit(1);
    }
  });
}

// Process Level Failure Handling
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled Rejection');
  shutdown('unhandledRejection');
});
