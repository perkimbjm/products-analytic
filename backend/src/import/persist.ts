import { getDatabase } from '../db/connection.js';
import { logger } from '../lib/logger.js';
import { NormalizedProduct } from '../lib/schemas/index.js';

interface LocationDedup {
  latitude: number;
  longitude: number;
  name?: string | null;
  id?: number;
}

interface CategoryCache {
  [name: string]: number;
}

interface SegmentCache {
  [name: string]: number;
}

export interface PersistResult {
  record_count: number;
  skipped_count: number;
  error?: string;
}

export function persistDataset(products: NormalizedProduct[], skippedCount: number): PersistResult {
  const db = getDatabase();

  try {
    const transaction = db.transaction(() => {
      // Build location deduplication map
      const locationMap = new Map<string, LocationDedup>();
      for (const product of products) {
        const key = `${product.latitude},${product.longitude}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            latitude: product.latitude,
            longitude: product.longitude,
            name: product.location_name,
          });
        }
      }

      // Insert locations (deduped) with geometry
      const insertLocationStmt = db.prepare(`
  INSERT INTO location (
    name,
    latitude,
    longitude
  )
  VALUES (?, ?, ?)
  ON CONFLICT(latitude, longitude) DO UPDATE SET
    name = COALESCE(excluded.name, location.name)
`);

for (const [, loc] of locationMap) {
  insertLocationStmt.run(
    loc.name || null,
    loc.latitude,
    loc.longitude
  );
}

      // Load location IDs for FK lookups
      const locationRows = db.prepare('SELECT id, latitude, longitude FROM location').all() as Array<{
        id: number;
        latitude: number;
        longitude: number;
      }>;

      const locationIdMap = new Map<string, number>();
      for (const row of locationRows) {
        const key = `${row.latitude},${row.longitude}`;
        locationIdMap.set(key, row.id);
      }

      // Cache categories and segments
      const categoryCache: CategoryCache = {};
      const segmentCache: SegmentCache = {};

      const categories = db.prepare('SELECT id, name FROM category').all() as Array<{ id: number; name: string }>;
      for (const { id, name } of categories) {
        categoryCache[name] = id;
      }

      const segments = db.prepare('SELECT id, name FROM segment').all() as Array<{ id: number; name: string }>;
      for (const { id, name } of segments) {
        segmentCache[name] = id;
      }

      // Upsert products
      const upsertProductStmt = db.prepare(`
        INSERT INTO product (
          product_key, name, category_id, segment_id, location_id, sub_category,
          cost_idr, total_orders, total_quantity, total_sales_idr, total_customers,
          avg_selling_price_idr, avg_order_revenue_idr, avg_monthly_revenue_idr,
          last_sale_date, recency_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(product_key, location_id) DO UPDATE SET
          name = excluded.name,
          category_id = excluded.category_id,
          segment_id = excluded.segment_id,
          sub_category = excluded.sub_category,
          cost_idr = excluded.cost_idr,
          total_orders = excluded.total_orders,
          total_quantity = excluded.total_quantity,
          total_sales_idr = excluded.total_sales_idr,
          total_customers = excluded.total_customers,
          avg_selling_price_idr = excluded.avg_selling_price_idr,
          avg_order_revenue_idr = excluded.avg_order_revenue_idr,
          avg_monthly_revenue_idr = excluded.avg_monthly_revenue_idr,
          last_sale_date = excluded.last_sale_date,
          recency_days = excluded.recency_days,
          updated_at = datetime('now')
      `);

      for (const product of products) {
        const locationKey = `${product.latitude},${product.longitude}`;
        const locationId = locationIdMap.get(locationKey);
        if (!locationId) {
          logger.warn(`Location not found for product ${product.product_key}`);
          continue;
        }

        const categoryId = categoryCache[product.category] ?? categoryCache['Unknown'];
        const segmentId = segmentCache[product.segment] ?? segmentCache['Unknown'];

        upsertProductStmt.run(
          product.product_key,
          product.name,
          categoryId,
          segmentId,
          locationId,
          product.sub_category || null,
          product.cost_idr,
          product.total_orders,
          product.total_quantity,
          product.total_sales_idr,
          product.total_customers,
          product.avg_selling_price_idr,
          product.avg_order_revenue_idr,
          product.avg_monthly_revenue_idr,
          product.last_sale_date,
          product.recency_days,
        );
      }

      // Record import_run
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO import_run (
          source, source_url, started_at, finished_at, status, record_count, skipped_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'mapid_dataset',
        null, // source_url can be set if needed
        now,
        now,
        'success',
        products.length,
        skippedCount,
      );

      logger.info(`Persisted ${products.length} products, ${locationMap.size} locations`);
    });

    transaction();

    return {
      record_count: products.length,
      skipped_count: skippedCount,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error('Failed to persist dataset', error);
    return {
      record_count: 0,
      skipped_count: products.length + skippedCount,
      error: msg,
    };
  }
}
