import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { config } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorEnvelope } from './lib/envelope.js';
import { AppError } from './lib/errors.js';
import healthRoutes from './routes/health.js';
import metaRoutes from './routes/meta.js';
import productsRoutes from './routes/products.js';
import analyticsRoutes from './routes/analytics.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  // Compress responses (gzip/brotli per Accept-Encoding) before any route runs.
  // JSON payloads (GeoJSON, analytics) shrink ~70-85% on the wire.
  app.use(compression());
  app.use(express.json());

  // CORS
  const allowedOrigins = new Set<string>([
    config.CORS_ORIGIN,
    ...(config.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
  ]);

  app.use((req, res, next) => {
    const requestOrigin = req.header('Origin');
    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
      res.header('Vary', 'Origin');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Logging — debug level so per-request logging stays out of the hot path in
  // production (LOG_LEVEL defaults to info).
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/', healthRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      logger.warn(`${error.statusCode} ${error.message}`);
      res.status(error.statusCode).json(errorEnvelope(error.message));
      return;
    }

    if (error instanceof Error) {
      logger.error('Unhandled error', error);
      res.status(500).json(errorEnvelope('Internal server error'));
      return;
    }

    logger.error('Unknown error', error);
    res.status(500).json(errorEnvelope('Internal server error'));
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json(errorEnvelope('Not found'));
  });

  return app;
}
