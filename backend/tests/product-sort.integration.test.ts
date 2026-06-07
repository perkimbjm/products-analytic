// Tests for ProductRepository sort ordering (buildOrderBy).
//
// Regression coverage for the bug where the Dashboard's Category, Segment,
// Customers, and Margin columns silently fell back to ORDER BY name because they
// were missing from the sortable-column whitelist.
//
// Runs the REAL buildOrderBy SQL against a private in-memory database created
// here — it never touches the app's `getDatabase()` singleton, so it can't
// contaminate (or be contaminated by) the other DB-backed integration tests.
// The fixture is arranged so each field's expected order DIFFERS from
// alphabetical name order: if a field ever falls back to name again, its
// assertion fails.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { applyMigrations } from './helpers/testDb.js';
import { buildOrderBy } from '../src/repositories/product.js';

// Lookup ids seeded by migration 002 (002_seed_lookups.sql).
const CATEGORY = { Accessories: 1, Clothing: 2, Bikes: 3 } as const;
const SEGMENT = { HighPerformer: 1, midRange: 2, LowPerformer: 3 } as const;

// price is 100 for all, so margin = (100 - cost) / 100.
//   Alpha: Clothing,     mid-range,      customers 20, margin .70
//   Beta:  Accessories,  High-Performer, customers 30, margin .20
//   Gamma: Bikes,        Low-Performer,  customers 10, margin .40
const PRODUCTS = [
  { product_key: 1, name: 'Alpha', category_id: CATEGORY.Clothing, segment_id: SEGMENT.midRange, total_customers: 20, cost_idr: 30 },
  { product_key: 2, name: 'Beta', category_id: CATEGORY.Accessories, segment_id: SEGMENT.HighPerformer, total_customers: 30, cost_idr: 80 },
  { product_key: 3, name: 'Gamma', category_id: CATEGORY.Bikes, segment_id: SEGMENT.LowPerformer, total_customers: 10, cost_idr: 60 },
];

let db: Database.Database;

/** Names in the order the real ORDER BY clause produces for the given sort string. */
function orderedNames(sort: string): string[] {
  const rows = db.prepare(`SELECT name FROM product ${buildOrderBy(sort)}`).all() as { name: string }[];
  return rows.map((r) => r.name);
}

before(() => {
  db = new Database(':memory:');
  applyMigrations(db);
  db.prepare('INSERT INTO location (id, name, latitude, longitude) VALUES (1, ?, ?, ?)').run('Jakarta', -6.2, 106.8);
  const insert = db.prepare(`
    INSERT INTO product
      (product_key, name, category_id, segment_id, location_id, total_customers, cost_idr, avg_selling_price_idr, total_quantity, total_sales_idr, last_sale_date)
    VALUES
      (@product_key, @name, @category_id, @segment_id, 1, @total_customers, @cost_idr, 100, 1, 1000, '2026-01-01')
  `);
  for (const row of PRODUCTS) insert.run(row);
});

after(() => {
  db.close();
});

// Baseline name order is [Alpha, Beta, Gamma]; every field below differs from it.
test('sorts by category name (was silently ignored)', () => {
  // Accessories(Beta) < Bikes(Gamma) < Clothing(Alpha)
  assert.deepEqual(orderedNames('category:asc'), ['Beta', 'Gamma', 'Alpha']);
  assert.deepEqual(orderedNames('category:desc'), ['Alpha', 'Gamma', 'Beta']);
});

test('sorts by segment name (was silently ignored)', () => {
  // High-Performer(Beta) < Low-Performer(Gamma) < mid-range(Alpha)
  assert.deepEqual(orderedNames('segment:asc'), ['Beta', 'Gamma', 'Alpha']);
  assert.deepEqual(orderedNames('segment:desc'), ['Alpha', 'Gamma', 'Beta']);
});

test('sorts by customers (was silently ignored)', () => {
  // 10(Gamma) < 20(Alpha) < 30(Beta)
  assert.deepEqual(orderedNames('customers:asc'), ['Gamma', 'Alpha', 'Beta']);
  assert.deepEqual(orderedNames('customers:desc'), ['Beta', 'Alpha', 'Gamma']);
});

test('sorts by margin (was silently ignored)', () => {
  // .20(Beta) < .40(Gamma) < .70(Alpha)
  assert.deepEqual(orderedNames('margin:asc'), ['Beta', 'Gamma', 'Alpha']);
  assert.deepEqual(orderedNames('margin:desc'), ['Alpha', 'Gamma', 'Beta']);
});

test('still sorts by previously-working fields', () => {
  assert.deepEqual(orderedNames('name:asc'), ['Alpha', 'Beta', 'Gamma']);
  // quantity is equal for all rows, so the name tiebreaker keeps a stable order.
  assert.deepEqual(orderedNames('quantity:asc'), ['Alpha', 'Beta', 'Gamma']);
});

test('an unknown sort field falls back to name order', () => {
  assert.deepEqual(orderedNames('bogus:asc'), ['Alpha', 'Beta', 'Gamma']);
});
