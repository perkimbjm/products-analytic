import { logger } from '../lib/logger.js';
import { sourceProductSchema, NormalizedProduct } from '../lib/schemas/index.js';
import { GeoJSONFeatureCollection } from '../types/index.js';

export interface TransformResult {
  products: NormalizedProduct[];
  skippedCount: number;
  errors: Array<{ id: string; reason: string }>;
}

export function parseGeoJSON(raw: string): GeoJSONFeatureCollection {
  const data = JSON.parse(raw);

  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('Invalid GeoJSON FeatureCollection');
  }

  return data;
}

export function transformDataset(geojson: GeoJSONFeatureCollection): TransformResult {
  const products: NormalizedProduct[] = [];
  const errors: Array<{ id: string; reason: string }> = [];
  let skippedCount = 0;

  for (const feature of geojson.features) {
    try {
      const featureId = feature.id || 'unknown';

      // Validate source
      const source = sourceProductSchema.parse(feature.properties);

      // Missing-data policy: coordinates are required
      if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length !== 2) {
        errors.push({ id: String(featureId), reason: 'Missing or invalid coordinates' });
        skippedCount++;
        continue;
      }

      const [longitude, latitude] = feature.geometry.coordinates;

      // Extract location name from source if available
      const locationName = (feature.properties as Record<string, unknown>)['location_name']
        || (feature.properties as Record<string, unknown>)['place_name']
        || (feature.properties as Record<string, unknown>)['city'];

      // Normalize
      const product: NormalizedProduct = {
        product_key: source.product_key,
        name: source.product_name,
        category: source.category || 'Unknown',
        segment: source.product_segment || 'Unknown',
        sub_category: source.sub_category,
        cost_idr: source.cost ?? 0,
        total_orders: source.total_orders ?? 0,
        total_quantity: source.total_quantity ?? 0,
        total_sales_idr: source.total_sales ?? 0,
        total_customers: source.total_customers ?? 0,
        avg_selling_price_idr: source.avg_selling_price ?? 0,
        avg_order_revenue_idr: source.avg_order_revenue ?? 0,
        avg_monthly_revenue_idr: source.avg_monthly_revenue ?? 0,
        last_sale_date: source.last_sale_date || new Date().toISOString().split('T')[0],
        recency_days: source.recency ?? 135,
        latitude,
        longitude,
        location_name: typeof locationName === 'string' ? locationName : null,
      };

      products.push(product);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push({ id: String(feature.id || 'unknown'), reason });
      skippedCount++;
    }
  }

  logger.info(`Transformed ${products.length} products, skipped ${skippedCount}`);
  if (errors.length > 0) {
    logger.warn(`Errors during transform: ${errors.length}`, { errors: errors.slice(0, 5) });
  }

  return { products, skippedCount, errors };
}
