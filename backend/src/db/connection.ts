import Database from 'better-sqlite3';
import { config } from '../config/env.js';
import { logger } from '../lib/logger.js';

let db: Database.Database | null = null;

export function openDatabase(): Database.Database {
  if (db) return db;

  try {
    db = new Database(config.DATABASE_PATH);

    // Load SpatiaLite extension.
    //db.loadExtension(config.SPATIALITE_EXTENSION_PATH);
    //logger.debug('SpatiaLite extension loaded');

    // Configure SQLite pragmas for performance/safety.
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('query_only = OFF'); // Allow writes

    logger.debug('SQLite pragmas configured');

    return db;
  } catch (error) {
    logger.error(`Failed to open database at ${config.DATABASE_PATH}`, error);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.debug('Database connection closed');
  }
}

export function initSpatialMetadata(): void {
  const db = getDatabase();
  try {
    db.exec('SELECT InitSpatialMetadata(1)');
    logger.debug('SpatiaLite metadata initialized');
  } catch (error) {
    // InitSpatialMetadata may fail if already initialized; this is OK.
    logger.debug('InitSpatialMetadata already done or skipped');
  }
}
