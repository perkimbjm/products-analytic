import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fetch } from 'undici';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

const CACHE_PATH = './data/raw/mapid-dataset.geojson';

export async function downloadDataset(useCache: boolean = false): Promise<string> {
  if (!config.MAPID_DATASET_URL) {
    throw new Error('MAPID_DATASET_URL not configured');
  }

  // Check cache
  if (useCache && existsSync(CACHE_PATH)) {
    logger.info('Using cached dataset');
    return readCachedDataset();
  }

  logger.info(`Downloading dataset from ${config.MAPID_DATASET_URL}`);

  try {
    const headers: Record<string, string> = {};
    if (config.MAPID_API_TOKEN) {
      headers['Authorization'] = `Bearer ${config.MAPID_API_TOKEN}`;
    }

    const response = await fetch(config.MAPID_DATASET_URL, {
      headers,
      dispatcher: undefined, // Use default dispatcher with timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();

    // Cache the raw response
    writeFileSync(CACHE_PATH, text, 'utf-8');
    logger.info(`Dataset cached to ${CACHE_PATH}`);

    return text;
  } catch (error) {
    logger.error('Failed to download dataset', error);
    throw error;
  }
}

export function readCachedDataset(): string {
  try {
    return readFileSync(CACHE_PATH, 'utf-8');
  } catch (error) {
    logger.error('Failed to read cached dataset', error);
    throw error;
  }
}
