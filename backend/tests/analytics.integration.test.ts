// DB-backed integration tests for AnalyticsRepository.
//
// Runs the real migrations against an in-memory SQLite database (forced via
// DATABASE_PATH=':memory:' in run-tests.ts), seeds a small deterministic fixture,
// then exercises the repository's SQL aggregation end-to-end. Covers KPIs,
// category/segment breakdowns, the cost histogram, maintenance buckets, filtering,
// and "Unknown" exclusion.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type Database from 'better-sqlite3';

import { applyMigrations, daysAgoUTC } from './helpers/testDb.js';

// Imported lazily in before() so the :memory: env var is honoured by the singleton.
let openDatabase: () => Database.Database;
let closeDatabase: () => void;
let repo: import('../src/repositories/analytics.js').AnalyticsRepository;

// Lookup ids seeded by migration 002 (002_seed_lookups.sql).
const CATEGORY = { Accessories: 1, Clothing: 2, Bikes: 3, Unknown: 999 } as const;
const SEGMENT = { HighPerformer: 1, midRange: 2, LowPerformer: 3, Unknown: 999 } as const;

// recency buckets: healthy <=30d, warning 31-90d, critical >90d.
const HEALTHY = daysAgoUTC(5);
const WARNING = daysAgoUTC(60);
const CRITICAL = daysAgoUTC(200);

interface FixtureProduct {
  product_key: number;
  name: string;
  category_id: number;
  segment_id: number;
  location_id: number;
  cost_idr: number;
  total_quantity: number;
  total_sales_idr: number;
  last_sale_date: string;
}

const PRODUCTS: FixtureProduct[] = [
  { product_key: 1, name: 'Mountain Bike', category_id: CATEGORY.Bikes, segment_id: SEGMENT.HighPerformer, location_id: 1, cost_idr: 1000, total_quantity: 10, total_sales_idr: 100_000, last_sale_date: HEALTHY },
  { product_key: 2, name: 'Road Bike', category_id: CATEGORY.Bikes, segment_id: SEGMENT.midRange, location_id: 1, cost_idr: 2000, total_quantity: 20, total_sales_idr: 200_000, last_sale_date: WARNING },
  { product_key: 3, name: 'Jersey', category_id: CATEGORY.Clothing, segment_id: SEGMENT.HighPerformer, location_id: 1, cost_idr: 3000, total_quantity: 30, total_sales_idr: 300_000, last_sale_date: CRITICAL },
  { product_key: 4, name: 'Shorts', category_id: CATEGORY.Clothing, segment_id: SEGMENT.LowPerformer, location_id: 2, cost_idr: 4000, total_quantity: 40, total_sales_idr: 400_000, last_sale_date: CRITICAL },
  { product_key: 5, name: 'Helmet', category_id: CATEGORY.Accessories, segment_id: SEGMENT.midRange, location_id: 2, cost_idr: 5000, total_quantity: 50, total_sales_idr: 500_000, last_sale_date: CRITICAL },
  { product_key: 6, name: 'Bottle', category_id: CATEGORY.Accessories, segment_id: SEGMENT.LowPerformer, location_id: 2, cost_idr: 100, total_quantity: 5, total_sales_idr: 5_000, last_sale_date: HEALTHY },
  // Unknown category/segment — must be excluded from category/segment breakdowns
  // but still counted by KPIs and the cost histogram.
  { product_key: 7, name: 'Mystery Item', category_id: CATEGORY.Unknown, segment_id: SEGMENT.Unknown, location_id: 1, cost_idr: 1500, total_quantity: 7, total_sales_idr: 70_000, last_sale_date: WARNING },
];

function seedFixture(db: Database.Database): void {
  db.prepare('INSERT INTO location (id, name, latitude, longitude) VALUES (?, ?, ?, ?)').run(1, 'Jakarta', -6.2, 106.8);
  db.prepare('INSERT INTO location (id, name, latitude, longitude) VALUES (?, ?, ?, ?)').run(2, 'Surabaya', -7.25, 112.75);

  const insert = db.prepare(`
    INSERT INTO product
      (product_key, name, category_id, segment_id, location_id, cost_idr, total_quantity, total_sales_idr, last_sale_date)
    VALUES
      (@product_key, @name, @category_id, @segment_id, @location_id, @cost_idr, @total_quantity, @total_sales_idr, @last_sale_date)
  `);
  const insertAll = db.transaction((rows: FixtureProduct[]) => {
    for (const row of rows) insert.run(row);
  });
  insertAll(PRODUCTS);
}

before(async () => {
  ({ openDatabase, closeDatabase } = await import('../src/db/connection.js'));
  const db = openDatabase();
  applyMigrations(db);
  seedFixture(db);

  const { AnalyticsRepository } = await import('../src/repositories/analytics.js');
  repo = new AnalyticsRepository();
});

after(() => {
  closeDatabase();
});

test('getKPIs aggregates totals across all products (incl. Unknown)', () => {
  const kpis = repo.getKPIs();
  assert.equal(kpis.totalProducts, 7);
  assert.equal(kpis.totalQuantity, 162); // 10+20+30+40+50+5+7
  assert.equal(kpis.totalSalesIdr, 1_575_000); // 100k..500k + 5k + 70k
  assert.equal(kpis.avgCostIdr, 2371); // round(16600 / 7)
});

test('getKPIs respects a category filter', () => {
  const kpis = repo.getKPIs(['Bikes']);
  assert.equal(kpis.totalProducts, 2);
  assert.equal(kpis.totalQuantity, 30);
  assert.equal(kpis.totalSalesIdr, 300_000);
  assert.equal(kpis.avgCostIdr, 1500);
});

test('getKPIs respects a segment filter', () => {
  const kpis = repo.getKPIs(undefined, ['High-Performer']);
  assert.equal(kpis.totalProducts, 2); // Mountain Bike + Jersey
  assert.equal(kpis.totalSalesIdr, 400_000);
});

test('getKPIs respects a cost range filter', () => {
  const kpis = repo.getKPIs(undefined, undefined, 3000, 5000);
  assert.equal(kpis.totalProducts, 3); // Jersey(3000), Shorts(4000), Helmet(5000)
});

test('getCategoryStats excludes Unknown and sums per category', () => {
  const stats = repo.getCategoryStats();
  assert.ok(stats.every((s) => s.category !== 'Unknown'), 'Unknown is excluded');

  const byCategory = new Map(stats.map((s) => [s.category, s]));
  assert.equal(stats.length, 3);
  assert.equal(byCategory.get('Bikes')?.count, 2);
  assert.equal(byCategory.get('Bikes')?.sales_idr, 300_000);
  assert.equal(byCategory.get('Clothing')?.count, 2);
  assert.equal(byCategory.get('Clothing')?.sales_idr, 700_000);
  assert.equal(byCategory.get('Accessories')?.count, 2);
  assert.equal(byCategory.get('Accessories')?.sales_idr, 505_000);

  // The three named categories account for every non-Unknown product.
  const named = stats.reduce((acc, s) => acc + s.count, 0);
  assert.equal(named, 6);
});

test('getSegmentStats excludes Unknown and sums per segment', () => {
  const stats = repo.getSegmentStats();
  assert.ok(stats.every((s) => s.segment !== 'Unknown'), 'Unknown is excluded');

  const bySegment = new Map(stats.map((s) => [s.segment, s]));
  assert.equal(stats.length, 3);
  assert.equal(bySegment.get('High-Performer')?.count, 2);
  assert.equal(bySegment.get('High-Performer')?.sales_idr, 400_000);
  assert.equal(bySegment.get('mid-range')?.count, 2);
  assert.equal(bySegment.get('mid-range')?.sales_idr, 700_000);
  assert.equal(bySegment.get('Low-Performer')?.count, 2);
  assert.equal(bySegment.get('Low-Performer')?.sales_idr, 405_000);
});

test('getCategoryStats respects a category filter', () => {
  const stats = repo.getCategoryStats(['Bikes']);
  assert.equal(stats.length, 1);
  assert.equal(stats[0].category, 'Bikes');
  assert.equal(stats[0].count, 2);
});

test('getCostHistogram returns the requested bins whose counts sum to the population (AC-012)', () => {
  const bins = repo.getCostHistogram(8);
  assert.equal(bins.length, 8);

  const totalCount = bins.reduce((acc, b) => acc + b.count, 0);
  assert.equal(totalCount, 7, 'every product lands in exactly one bin');

  assert.equal(bins[0].min, 100, 'first bin starts at the min cost');
  assert.equal(bins[bins.length - 1].max, 5000, 'last bin ends at the max cost');
});

test('getCostHistogram is filterable and partitions the filtered population', () => {
  const bins = repo.getCostHistogram(4, ['Bikes']);
  const totalCount = bins.reduce((acc, b) => acc + b.count, 0);
  assert.equal(totalCount, 2); // two Bikes products
});

test('getCostHistogram returns an empty array when no products match', () => {
  // Bikes are only High-Performer / mid-range, so this combination is empty.
  const bins = repo.getCostHistogram(8, ['Bikes'], ['Low-Performer']);
  assert.deepEqual(bins, []);
});

test('getMaintenanceStats buckets products by recency of last sale', () => {
  const stats = repo.getMaintenanceStats();
  assert.equal(stats.healthy, 2); // 5 days ago x2
  assert.equal(stats.warning, 2); // 60 days ago x2 (incl. Unknown)
  assert.equal(stats.critical, 3); // 200 days ago x3

  // Buckets account for the whole population.
  assert.equal(stats.healthy + stats.warning + stats.critical, PRODUCTS.length);
});

test('getMaintenanceStats respects a category filter', () => {
  const stats = repo.getMaintenanceStats(['Bikes']);
  assert.equal(stats.healthy, 1); // Mountain Bike
  assert.equal(stats.warning, 1); // Road Bike
  assert.equal(stats.critical, 0);
});
