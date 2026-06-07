import { openDatabase, closeDatabase } from '../db/connection.js';
import { logger } from '../lib/logger.js';
import { seedDatabase } from './seed.js';
import { downloadDataset, readCachedDataset } from './download.js';
import { parseGeoJSON, transformDataset } from './transform.js';
import { persistDataset } from './persist.js';

const command = process.argv[2];
const useCache = process.argv.includes('--use-cache');
const dryRun = process.argv.includes('--dry-run');

async function runImport(): Promise<void> {
  logger.info('Starting import');

  try {
    openDatabase();

    // Download the dataset
    let raw: string;
    try {
      raw = await downloadDataset(useCache);
    } catch (error) {
      logger.error('Download failed', error);
      if (useCache) {
        logger.info('Falling back to cache');
        raw = readCachedDataset();
      } else {
        throw error;
      }
    }

    // Parse and transform
    const geojson = parseGeoJSON(raw);
    logger.info(`Parsed GeoJSON with ${geojson.features.length} features`);

    const { products, skippedCount } = transformDataset(geojson);
    logger.info(`Transformed ${products.length} products, skipped ${skippedCount}`);

    if (dryRun) {
      logger.info('Dry run mode: not persisting');
      return;
    }

    // Persist
    const result = persistDataset(products, skippedCount);
    if (result.error) {
      logger.error('Persist failed', new Error(result.error));
      throw new Error(result.error);
    }

    logger.info(`Import complete: ${result.record_count} products, ${result.skipped_count} skipped`);
  } finally {
    closeDatabase();
  }
}

async function runSeed(): Promise<void> {
  logger.info('Starting seed');

  try {
    openDatabase();
    await seedDatabase();
  } finally {
    closeDatabase();
  }
}

async function main(): Promise<void> {
  try {
    if (command === 'import') {
      await runImport();
    } else if (command === 'seed') {
      await runSeed();
    } else {
      console.log('Usage: npm run import [-- --use-cache] [-- --dry-run]');
      console.log('       npm run seed');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Command failed', error);
    process.exit(1);
  }
}

void main();
