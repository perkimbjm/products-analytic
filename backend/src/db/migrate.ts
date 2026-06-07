import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { openDatabase, getDatabase } from './connection.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface Migration {
  version: number;
  name: string;
  sql: string;
}

function loadMigrations(): Migration[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.*)\.sql$/);
    if (!match) throw new Error(`Invalid migration filename: ${file}`);

    const [, versionStr, name] = match;
    const version = parseInt(versionStr, 10);
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

    return { version, name, sql };
  });
}

function ensureSchemaMigrationsTable(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

function getAppliedMigrations(): Set<number> {
  const db = getDatabase();
  const rows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;
  return new Set(rows.map((r) => r.version));
}

function applyMigration(version: number, name: string, sql: string): void {
  const db = getDatabase();

  try {
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, name);
    });

    transaction();
    logger.info(`Migration ${version} (${name}) applied`);
  } catch (error) {
    logger.error(`Failed to apply migration ${version}`, error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  openDatabase();
  //initSpatialMetadata();
  ensureSchemaMigrationsTable();

  const migrations = loadMigrations();
  const applied = getAppliedMigrations();

  let count = 0;
  for (const { version, name, sql } of migrations) {
    if (!applied.has(version)) {
      applyMigration(version, name, sql);
      count++;
    }
  }

  logger.info(`${count} new migrations applied (${migrations.length} total)`);
}

function showMigrationStatus(): void {
  openDatabase();
  ensureSchemaMigrationsTable();

  const db = getDatabase();
  const applied = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version').all() as Array<{
    version: number;
    name: string;
    applied_at: string;
  }>;

  if (applied.length === 0) {
    console.log('No migrations applied yet.');
    return;
  }

  console.log('Applied Migrations:');
  for (const { version, name, applied_at } of applied) {
    console.log(`  ${version.toString().padStart(3, '0')} ${name.padEnd(40)} ${applied_at}`);
  }
}

// CLI entry point.
const arg = process.argv[2];
if (arg === '--status') {
  showMigrationStatus();
} else {
  try {
    await runMigrations();
  } catch (error) {
    process.exit(1);
  }
}
