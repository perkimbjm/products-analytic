import { Router, Request, Response } from 'express';
import { successEnvelope, errorEnvelope } from '../lib/envelope.js';
import { metaRepository } from '../repositories/meta.js';
import { productRepository } from '../repositories/product.js';
import { cacheControl, CACHE_STATIC_MAX_AGE, CACHE_SEMI_STATIC_MAX_AGE } from '../lib/http-cache.js';

const router = Router();

// GET /api/meta/filters
router.get('/filters', cacheControl(CACHE_STATIC_MAX_AGE), (_req: Request, res: Response) => {
  try {
    const filters = metaRepository.getFilters();
    res.json(successEnvelope(filters));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch filters'));
  }
});

// GET /api/meta/freshness
router.get('/freshness', cacheControl(CACHE_SEMI_STATIC_MAX_AGE), (_req: Request, res: Response) => {
  try {
    const freshness = metaRepository.getFreshness();
    if (!freshness) {
      res.json(
        successEnvelope({
          last_updated: null,
          message: 'No data imported yet. Run "npm run seed" or "npm run import".',
        }),
      );
      return;
    }
    res.json(successEnvelope(freshness));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch freshness'));
  }
});

// GET /api/meta/categories
router.get('/categories', cacheControl(CACHE_STATIC_MAX_AGE), (_req: Request, res: Response) => {
  try {
    const categories = productRepository.getCategories();
    res.json(successEnvelope(categories));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch categories'));
  }
});

// GET /api/meta/segments
router.get('/segments', cacheControl(CACHE_STATIC_MAX_AGE), (_req: Request, res: Response) => {
  try {
    const segments = productRepository.getSegments();
    res.json(successEnvelope(segments));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch segments'));
  }
});

export default router;
