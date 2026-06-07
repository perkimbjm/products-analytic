import { getDatabase } from '../db/connection.js';
import { buildBinRanges, toHistogramBins } from '../lib/histogram.js';

export interface KPIs {
  totalProducts: number;
  totalQuantity: number;
  totalSalesIdr: number;
  avgCostIdr: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  sales_idr: number;
}

export interface SegmentStats {
  segment: string;
  count: number;
  sales_idr: number;
}

export interface CostHistogramBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface MaintenanceStats {
  healthy: number;
  warning: number;
  critical: number;
  healthyThresholdDate: string;
  warningThresholdDate: string;
}

export class AnalyticsRepository {
  getKPIs(
    categories?: string[],
    segments?: string[],
    minCost?: number,
    maxCost?: number,
    search?: string,
  ): KPIs {
    const db = getDatabase();

    let sql = `
      SELECT
        COUNT(*) as totalProducts,
        COALESCE(SUM(total_quantity), 0) as totalQuantity,
        COALESCE(SUM(total_sales_idr), 0) as totalSalesIdr,
        COALESCE(AVG(cost_idr), 0) as avgCostIdr
      FROM product
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...segments);
    }

    if (search) {
      const ftsExpr = search.trim().split(/\s+/).filter(Boolean).map((w) => `${w}*`).join(' ');
      if (ftsExpr) {
        sql += ` AND id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND (name LIKE ? OR sub_category LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term);
      }
    }

    if (minCost !== undefined) {
      sql += ` AND cost_idr >= ?`;
      params.push(minCost);
    }

    if (maxCost !== undefined) {
      sql += ` AND cost_idr <= ?`;
      params.push(maxCost);
    }

    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as {
      totalProducts: number;
      totalQuantity: number;
      totalSalesIdr: number;
      avgCostIdr: number;
    };

    return {
      totalProducts: row.totalProducts,
      totalQuantity: row.totalQuantity,
      totalSalesIdr: row.totalSalesIdr,
      avgCostIdr: Math.round(row.avgCostIdr),
    };
  }

  getCategoryStats(
    categories?: string[],
    segments?: string[],
    minCost?: number,
    maxCost?: number,
    search?: string,
  ): CategoryStats[] {
    const db = getDatabase();

    let sql = `
      SELECT
        c.name as category,
        COUNT(*) as count,
        COALESCE(SUM(p.total_sales_idr), 0) as sales_idr
      FROM product p
      JOIN category c ON p.category_id = c.id
      WHERE c.name != 'Unknown'
    `;
    const params: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND c.name IN (${placeholders})`;
      params.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND p.segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...segments);
    }

    if (search) {
      const ftsExpr = search.trim().split(/\s+/).filter(Boolean).map((w) => `${w}*`).join(' ');
      if (ftsExpr) {
        sql += ` AND p.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND (p.name LIKE ? OR p.sub_category LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term);
      }
    }

    if (minCost !== undefined) {
      sql += ` AND p.cost_idr >= ?`;
      params.push(minCost);
    }

    if (maxCost !== undefined) {
      sql += ` AND p.cost_idr <= ?`;
      params.push(maxCost);
    }

    sql += ` GROUP BY c.id, c.name ORDER BY count DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params) as CategoryStats[];
  }

  getSegmentStats(
    categories?: string[],
    segments?: string[],
    minCost?: number,
    maxCost?: number,
    search?: string,
  ): SegmentStats[] {
    const db = getDatabase();

    let sql = `
      SELECT
        s.name as segment,
        COUNT(*) as count,
        COALESCE(SUM(p.total_sales_idr), 0) as sales_idr
      FROM product p
      JOIN segment s ON p.segment_id = s.id
      WHERE s.name != 'Unknown'
    `;
    const params: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND p.category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND s.name IN (${placeholders})`;
      params.push(...segments);
    }

    if (search) {
      const ftsExpr = search.trim().split(/\s+/).filter(Boolean).map((w) => `${w}*`).join(' ');
      if (ftsExpr) {
        sql += ` AND p.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND (p.name LIKE ? OR p.sub_category LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term);
      }
    }

    if (minCost !== undefined) {
      sql += ` AND p.cost_idr >= ?`;
      params.push(minCost);
    }

    if (maxCost !== undefined) {
      sql += ` AND p.cost_idr <= ?`;
      params.push(maxCost);
    }

    sql += ` GROUP BY s.id, s.name ORDER BY count DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params) as SegmentStats[];
  }

  getCostHistogram(
    binCount: number = 8,
    categories?: string[],
    segments?: string[],
  ): CostHistogramBin[] {
    const db = getDatabase();

    // Single query: get min/max and all data
    let sql = 'SELECT MIN(cost_idr) as minCost, MAX(cost_idr) as maxCost, COUNT(*) as total FROM product WHERE 1=1';
    const params: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...segments);
    }

    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as { minCost: number | null; maxCost: number | null; total: number };

    if (!row.minCost || !row.maxCost) {
      return [];
    }

    const min = row.minCost;
    const max = row.maxCost;
    const totalCount = row.total;

    const binRanges = buildBinRanges(min, max, binCount);

    // Second query: get distribution across bins
    const caseStatements = binRanges.map(
      (range, i) =>
        `SUM(CASE WHEN cost_idr >= ${range.min} AND cost_idr <= ${range.max} THEN 1 ELSE 0 END) as bin_${i}`,
    );

    let distributionSql = `SELECT ${caseStatements.join(', ')} FROM product WHERE 1=1`;
    const distributionParams: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      distributionSql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      distributionParams.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      distributionSql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      distributionParams.push(...segments);
    }

    const distributionStmt = db.prepare(distributionSql);
    const distribution = distributionStmt.get(...distributionParams) as Record<string, number>;

    const counts = binRanges.map((_, i) => (distribution[`bin_${i}`] as number) || 0);
    return toHistogramBins(binRanges, counts, totalCount);
  }

  getMaintenanceStats(
    categories?: string[],
    segments?: string[],
    minCost?: number,
    maxCost?: number,
  ): MaintenanceStats {
    const db = getDatabase();

    let sql = `
      SELECT
        SUM(CASE WHEN julianday('now') - julianday(last_sale_date) <= 30 THEN 1 ELSE 0 END) as healthy,
        SUM(CASE WHEN julianday('now') - julianday(last_sale_date) > 30 AND julianday('now') - julianday(last_sale_date) <= 90 THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN julianday('now') - julianday(last_sale_date) > 90 THEN 1 ELSE 0 END) as critical
      FROM product
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (categories && categories.length > 0) {
      const placeholders = categories.map(() => '?').join(',');
      sql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...categories);
    }

    if (segments && segments.length > 0) {
      const placeholders = segments.map(() => '?').join(',');
      sql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...segments);
    }

    if (minCost !== undefined) {
      sql += ` AND cost_idr >= ?`;
      params.push(minCost);
    }

    if (maxCost !== undefined) {
      sql += ` AND cost_idr <= ?`;
      params.push(maxCost);
    }

    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as {
      healthy: number | null;
      warning: number | null;
      critical: number | null;
    };

    // Compute threshold dates (dynamic, relative to today).
    const now = new Date();
    const healthyThreshold = new Date(now);
    healthyThreshold.setDate(healthyThreshold.getDate() - 30);
    const warningThreshold = new Date(now);
    warningThreshold.setDate(warningThreshold.getDate() - 90);

    return {
      healthy: row.healthy || 0,
      warning: row.warning || 0,
      critical: row.critical || 0,
      healthyThresholdDate: healthyThreshold.toISOString().split('T')[0],
      warningThresholdDate: warningThreshold.toISOString().split('T')[0],
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
