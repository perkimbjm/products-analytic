import { Router, Request, Response } from 'express';
import { successEnvelope, errorEnvelope } from '../lib/envelope.js';
import { productService } from '../services/product.js';
import { productRepository } from '../repositories/product.js';
import { toProductDTO } from '../lib/dtos/product.js';
import { cacheControl, CACHE_STATIC_MAX_AGE } from '../lib/http-cache.js';
import type { ProductFilter } from '../repositories/product.js';

const router = Router();

// GET /api/products
router.get('/', (req: Request, res: Response) => {
  try {
    const categories = req.query.categories ? (Array.isArray(req.query.categories) ? (req.query.categories as string[]) : [req.query.categories as string]) : undefined;
    const segments = req.query.segments ? (Array.isArray(req.query.segments) ? (req.query.segments as string[]) : [req.query.segments as string]) : undefined;

    const filter: ProductFilter = {
      categories,
      segments,
      search: req.query.search as string | undefined,
      minCost: req.query.minCost ? Number(req.query.minCost) : undefined,
      maxCost: req.query.maxCost ? Number(req.query.maxCost) : undefined,
      sort: req.query.sort as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : 50,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    };

    const products = productService.getProductsWithRelations(filter);
    const count = productService.countWithFilter(filter);

    const dtos = products.map(toProductDTO);

    res.json(
      successEnvelope(dtos, {
        total: count,
        count: products.length,
        limit: filter.limit,
        offset: filter.offset,
      }),
    );
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch products'));
  }
});

// NOTE: literal/static routes (`/locations`, `/geojson`) MUST be declared before the
// parametric `/:id` route, otherwise Express matches `/:id` first and captures the
// literal segment (e.g. id="locations" -> NaN -> 404 "Product not found").

// GET /api/products/locations
router.get('/locations', cacheControl(CACHE_STATIC_MAX_AGE), (_req: Request, res: Response) => {
  try {
    const locations = productRepository.getLocations();
    res.json(successEnvelope(locations));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch locations'));
  }
});

// GET /api/products/geojson (NEW)
// Export products as GeoJSON for external GIS tools (QGIS, ArcGIS, etc.)
router.get('/geojson', cacheControl(CACHE_STATIC_MAX_AGE), (req: Request, res: Response): void => {
  try {
    const categories = req.query.categories ? (Array.isArray(req.query.categories) ? (req.query.categories as string[]) : [req.query.categories as string]) : undefined;
    const segments = req.query.segments ? (Array.isArray(req.query.segments) ? (req.query.segments as string[]) : [req.query.segments as string]) : undefined;

    const requestedLimit = req.query.limit ? Number(req.query.limit) : 5000;
    const limit = Math.min(requestedLimit, 10000); // hard cap

    const filter: ProductFilter = {
      categories,
      segments,
      search: req.query.search as string | undefined,
      minCost: req.query.minCost ? Number(req.query.minCost) : undefined,
      maxCost: req.query.maxCost ? Number(req.query.maxCost) : undefined,
      limit,
      offset: 0,
    };

    const products = productService.getProductsWithRelations(filter);

    const features = products
      .filter((p) => p.location)
      .map((p) => ({
        type: 'Feature' as const,
        id: p.id,
        geometry: {
          type: 'Point' as const,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          coordinates: [p.location!.longitude, p.location!.latitude] as [number, number],
        },
        properties: {
          id: p.id,
          name: p.name,
          category: p.category_name,
          segment: p.segment_name,
          cost: p.cost_idr,
          sales: p.total_sales_idr,
          orders: p.total_orders,
        },
      }));

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    };

    res.json(geojson);
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to generate GeoJSON'));
  }
});

// GET /api/products/:id — parametric route LAST so it does not shadow literal paths above.
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      res.status(400).json(errorEnvelope('Invalid product id'));
      return;
    }

    const product = productService.getProductById(id);

    if (!product) {
      res.status(404).json(errorEnvelope('Product not found'));
      return;
    }

    const dto = toProductDTO(product);
    res.json(successEnvelope(dto));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch product'));
  }
});

export default router;
