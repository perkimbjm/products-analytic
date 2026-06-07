import { getDatabase } from '../db/connection.js';

export interface FilterOption {
  id: number;
  name: string;
}

export interface FilterOptions {
  categories: FilterOption[];
  segments: FilterOption[];
}

export interface FreshnessInfo {
  last_updated: string;
  source: string;
  record_count: number;
}

export class MetaRepository {
  getFilters(): FilterOptions {
    const db = getDatabase();

    const categories = (
      db.prepare('SELECT id, name FROM category WHERE name != ? ORDER BY name').all('Unknown') as Array<{
        id: number;
        name: string;
      }>
    );

    const segments = (
      db.prepare('SELECT id, name FROM segment WHERE name != ? ORDER BY name').all('Unknown') as Array<{
        id: number;
        name: string;
      }>
    );

    return { categories, segments };
  }

  getFreshness(): FreshnessInfo | null {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT finished_at, source, record_count
      FROM import_run
      WHERE status = 'success'
      ORDER BY finished_at DESC
      LIMIT 1
    `);

    const row = stmt.get() as { finished_at: string; source: string; record_count: number } | undefined;

    if (!row) {
      return null;
    }

    return {
      last_updated: row.finished_at,
      source: row.source,
      record_count: row.record_count,
    };
  }
}

export const metaRepository = new MetaRepository();
