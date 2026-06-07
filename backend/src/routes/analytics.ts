import { Router, Request, Response } from 'express';
import { successEnvelope, errorEnvelope } from '../lib/envelope.js';
import { analyticsRepository } from '../repositories/analytics.js';
import { getDatabase } from '../db/connection.js';
import { cacheControl, CACHE_SEMI_STATIC_MAX_AGE } from '../lib/http-cache.js';
import type { MapPointDTO, TopProductDTO, DashboardDTO } from '../lib/dtos/analytics.js';

const router = Router();

function buildFtsQuery(term: string): string {
  const trimmed = term.trim();
  if (trimmed.length < 2) return '';
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}*`)
    .join(' ');
}

// All analytics endpoints are filter-aware aggregations that only change on a
// re-import; cache successful responses briefly (keyed by full URL incl. query).
router.use(cacheControl(CACHE_SEMI_STATIC_MAX_AGE));

function parseFilterParams(
  req: Request,
): {
  categories?: string[];
  segments?: string[];
  search?: string;
  minCost?: number;
  maxCost?: number;
} {
  return {
    categories: req.query.categories ? (Array.isArray(req.query.categories) ? (req.query.categories as string[]) : [req.query.categories as string]) : undefined,
    segments: req.query.segments ? (Array.isArray(req.query.segments) ? (req.query.segments as string[]) : [req.query.segments as string]) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    minCost: req.query.minCost ? Number(req.query.minCost) : undefined,
    maxCost: req.query.maxCost ? Number(req.query.maxCost) : undefined,
  };
}

// GET /api/analytics/kpis
router.get('/kpis', (req: Request, res: Response) => {
  try {
    const filters = parseFilterParams(req);
    const kpis = analyticsRepository.getKPIs(filters.categories, filters.segments, filters.minCost, filters.maxCost, filters.search);
    res.json(successEnvelope(kpis));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch KPIs'));
  }
});

// GET /api/analytics/category
router.get('/category', (req: Request, res: Response) => {
  try {
    const filters = parseFilterParams(req);
    const stats = analyticsRepository.getCategoryStats(filters.categories, filters.segments, filters.minCost, filters.maxCost, filters.search);
    res.json(successEnvelope(stats));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch category analytics'));
  }
});

// GET /api/analytics/segment
router.get('/segment', (req: Request, res: Response) => {
  try {
    const filters = parseFilterParams(req);
    const stats = analyticsRepository.getSegmentStats(filters.categories, filters.segments, filters.minCost, filters.maxCost, filters.search);
    res.json(successEnvelope(stats));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch segment analytics'));
  }
});

// GET /api/analytics/cost
router.get('/cost', (req: Request, res: Response) => {
  try {
    const filters = parseFilterParams(req);
    const binCount = req.query.bins ? Number(req.query.bins) : 8;
    const histogram = analyticsRepository.getCostHistogram(binCount, filters.categories, filters.segments);
    res.json(successEnvelope(histogram));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch cost histogram'));
  }
});

// GET /api/analytics/maintenance
router.get('/maintenance', (req: Request, res: Response) => {
  try {
    const filters = parseFilterParams(req);
    const stats = analyticsRepository.getMaintenanceStats(filters.categories, filters.segments, filters.minCost, filters.maxCost);
    res.json(successEnvelope(stats));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch maintenance stats'));
  }
});

// GET /api/analytics/map-points (NEW)
// Optimized for GIS rendering — minimal fields only
router.get('/map-points', (req: Request, res: Response): void => {
  try {
    const db = getDatabase();
    const filters = parseFilterParams(req);

    let sql = `
      SELECT
        p.id,
        p.name,
        c.name as category,
        s.name as segment,
        p.sub_category as subCategory,
        l.latitude,
        l.longitude,
        p.total_sales_idr as sales,
        p.total_orders as orders,
        p.avg_selling_price_idr as avgSellingPrice,
        p.avg_monthly_revenue_idr as avgMonthlyRevenue,
        p.last_sale_date as lastSaleDate
      FROM product p
      JOIN category c ON p.category_id = c.id
      JOIN segment s ON p.segment_id = s.id
      JOIN location l ON p.location_id = l.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters.categories && filters.categories.length > 0) {
      const placeholders = filters.categories.map(() => '?').join(',');
      sql += ` AND c.name IN (${placeholders})`;
      params.push(...filters.categories);
    }

    if (filters.segments && filters.segments.length > 0) {
      const placeholders = filters.segments.map(() => '?').join(',');
      sql += ` AND s.name IN (${placeholders})`;
      params.push(...filters.segments);
    }

    if (filters.search) {
      const ftsExpr = buildFtsQuery(filters.search);
      if (ftsExpr) {
        sql += ` AND p.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${filters.search}%`);
      }
    }

    if (filters.minCost !== undefined) {
      sql += ` AND p.cost_idr >= ?`;
      params.push(filters.minCost);
    }

    if (filters.maxCost !== undefined) {
      sql += ` AND p.cost_idr <= ?`;
      params.push(filters.maxCost);
    }

    const stmt = db.prepare(sql);
    const points = stmt.all(...params) as MapPointDTO[];

    res.json(successEnvelope(points));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch map points'));
  }
});

// GET /api/analytics/top-products (NEW)
// List top N products by sales, filter-aware
router.get('/top-products', (req: Request, res: Response): void => {
  try {
    const db = getDatabase();
    const limit = Number(req.query.limit) || 10;
    const filters = parseFilterParams(req);

    let sql = `
      SELECT
        p.id,
        p.name,
        p.total_sales_idr as sales
      FROM product p
      JOIN category c ON p.category_id = c.id
      JOIN segment s ON p.segment_id = s.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (filters.categories && filters.categories.length > 0) {
      const placeholders = filters.categories.map(() => '?').join(',');
      sql += ` AND c.name IN (${placeholders})`;
      params.push(...filters.categories);
    }

    if (filters.segments && filters.segments.length > 0) {
      const placeholders = filters.segments.map(() => '?').join(',');
      sql += ` AND s.name IN (${placeholders})`;
      params.push(...filters.segments);
    }

    if (filters.search) {
      const ftsExpr = buildFtsQuery(filters.search);
      if (ftsExpr) {
        sql += ` AND p.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${filters.search}%`);
      }
    }

    sql += ` ORDER BY p.total_sales_idr DESC LIMIT ?`;
    params.push(limit);

    const stmt = db.prepare(sql);
    const products = stmt.all(...params) as TopProductDTO[];

    res.json(successEnvelope(products));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch top products'));
  }
});

// GET /api/analytics/dashboard (NEW)
// Single request for dashboard initialization
router.get('/dashboard', (_req: Request, res: Response): void => {
  try {
    const db = getDatabase();

    // KPIs
    const kpisRow = db.prepare(`
      SELECT
        COUNT(*) as totalProducts,
        COALESCE(SUM(total_sales_idr), 0) as totalSales,
        COALESCE(SUM(total_orders), 0) as totalOrders,
        ROUND(COALESCE(AVG(cost_idr), 0)) as avgProductValue
      FROM product
    `).get() as {
      totalProducts: number;
      totalSales: number;
      totalOrders: number;
      avgProductValue: number;
    };

    // Category breakdown
    const categories = db.prepare(`
      SELECT
        c.name as category,
        COUNT(*) as count,
        COALESCE(SUM(p.total_sales_idr), 0) as sales
      FROM product p
      JOIN category c ON p.category_id = c.id
      WHERE c.name != 'Unknown'
      GROUP BY c.id, c.name
      ORDER BY sales DESC
    `).all() as Array<{ category: string; count: number; sales: number }>;

    // Segment breakdown
    const segments = db.prepare(`
      SELECT
        s.name as segment,
        COUNT(*) as count,
        COALESCE(SUM(p.total_sales_idr), 0) as sales
      FROM product p
      JOIN segment s ON p.segment_id = s.id
      WHERE s.name != 'Unknown'
      GROUP BY s.id, s.name
      ORDER BY sales DESC
    `).all() as Array<{ segment: string; count: number; sales: number }>;

    // Top products
    const topProducts = db.prepare(`
      SELECT
        id,
        name,
        total_sales_idr as sales
      FROM product
      ORDER BY total_sales_idr DESC
      LIMIT 10
    `).all() as TopProductDTO[];

    const dashboard: DashboardDTO = {
      kpis: kpisRow,
      categoryBreakdown: categories,
      segmentBreakdown: segments,
      topProducts,
    };

    res.json(successEnvelope(dashboard));
  } catch (error) {
    res.status(500).json(errorEnvelope('Failed to fetch dashboard'));
  }
});

export default router;
