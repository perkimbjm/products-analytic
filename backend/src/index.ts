import { config } from './config/env.js';
import { openDatabase, closeDatabase } from './db/connection.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';

async function main(): Promise<void> {
  logger.info(`Starting Product Analysis Dashboard API (${config.NODE_ENV})`);

  try {
    // Open database
    openDatabase();
    logger.info('Database opened');

    // Create and start Express app
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on http://localhost:${config.PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      server.close(() => {
        closeDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

void main();
