import { readFileSync, existsSync } from 'fs';
import { logger } from '../lib/logger.js';
import { parseGeoJSON, transformDataset } from './transform.js';
import { persistDataset } from './persist.js';

const SEED_PATH = './data/seed/sample.json';

export async function seedDatabase(): Promise<void> {
  if (!existsSync(SEED_PATH)) {
    // If no seed file exists, create a minimal sample for bootstrap
    logger.warn(`Seed file not found at ${SEED_PATH}. Database will be empty until you run 'npm run import'.`);
    return;
  }

  try {
    logger.info('Loading seed dataset');
    const raw = readFileSync(SEED_PATH, 'utf-8');

    const geojson = parseGeoJSON(raw);
    logger.info(`Parsed GeoJSON with ${geojson.features.length} features`);

    const { products, skippedCount } = transformDataset(geojson);
    logger.info(`Transformed ${products.length} products`);

    const result = persistDataset(products, skippedCount);
    if (result.error) {
      logger.error('Seed failed', new Error(result.error));
      throw new Error(`Seed persist failed: ${result.error}`);
    }

    logger.info(`Seed complete: ${result.record_count} products, ${result.skipped_count} skipped`);
  } catch (error) {
    logger.error('Seed failed', error);
    throw error;
  }
}
