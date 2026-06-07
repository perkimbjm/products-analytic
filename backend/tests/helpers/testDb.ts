// Shared helpers for DB-backed integration tests.
//
// The migrations are all plain SQLite DDL/DML (no SpatiaLite functions — the
// `location` table stores plain lat/lon REAL columns), so they apply cleanly to
// an in-memory database. We read the real migration files rather than a hand-rolled
// schema so integration tests stay faithful to production and catch schema drift.

import type Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../src/db/migrations',
);

/** Apply every numbered migration SQL file in order to the given database. */
export function applyMigrations(db: Database.Database): void {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8'));
  }
}

/** A 'YYYY-MM-DD' string for the UTC calendar date `n` days before today. */
export function daysAgoUTC(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}
