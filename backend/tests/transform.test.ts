import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseGeoJSON, transformDataset } from '../src/import/transform.js';
import { GeoJSONFeatureCollection } from '../src/types/index.js';

// A fully-valid source feature; individual tests override fields as needed.
function makeFeature(overrides: Record<string, unknown> = {}, geometryOverride?: unknown) {
  const properties = {
    product_key: 1,
    product_name: 'Trail Bike',
    category: 'Bikes',
    sub_category: 'Mountain',
    product_segment: 'High-Performer',
    cost: 1500,
    total_orders: 10,
    total_quantity: 20,
    total_sales: 50000,
    total_customers: 8,
    avg_selling_price: 2500.5,
    avg_order_revenue: 5000.25,
    avg_monthly_revenue: 1200.75,
    last_sale_date: '2026-01-15',
    recency: 42,
    ...overrides,
  };
  return {
    type: 'Feature',
    id: properties.product_key,
    geometry:
      geometryOverride !== undefined
        ? geometryOverride
        : { type: 'Point', coordinates: [110.4, -7.8] }, // [lon, lat]
    properties,
  };
}

function makeCollection(features: unknown[]): GeoJSONFeatureCollection {
  return { type: 'FeatureCollection', features } as GeoJSONFeatureCollection;
}

test('parseGeoJSON returns the parsed FeatureCollection for valid input', () => {
  const raw = JSON.stringify(makeCollection([makeFeature()]));
  const parsed = parseGeoJSON(raw);
  assert.equal(parsed.type, 'FeatureCollection');
  assert.equal(parsed.features.length, 1);
});

test('parseGeoJSON throws when the top-level type is not a FeatureCollection', () => {
  const raw = JSON.stringify({ type: 'Feature', features: [] });
  assert.throws(() => parseGeoJSON(raw), /Invalid GeoJSON FeatureCollection/);
});

test('parseGeoJSON throws when features is not an array', () => {
  const raw = JSON.stringify({ type: 'FeatureCollection', features: {} });
  assert.throws(() => parseGeoJSON(raw), /Invalid GeoJSON FeatureCollection/);
});

test('parseGeoJSON propagates JSON syntax errors', () => {
  assert.throws(() => parseGeoJSON('{ not json'));
});

test('transformDataset maps a valid feature and preserves lon/lat ordering', () => {
  const result = transformDataset(makeCollection([makeFeature()]));

  assert.equal(result.products.length, 1);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.errors.length, 0);

  const product = result.products[0];
  assert.equal(product.product_key, 1);
  assert.equal(product.name, 'Trail Bike');
  assert.equal(product.category, 'Bikes');
  assert.equal(product.segment, 'High-Performer');
  assert.equal(product.cost_idr, 1500);
  assert.equal(product.total_sales_idr, 50000);
  // GeoJSON is [longitude, latitude]; the transform must not swap them.
  assert.equal(product.longitude, 110.4);
  assert.equal(product.latitude, -7.8);
  assert.equal(product.recency_days, 42);
});

test('transformDataset skips features with missing geometry and records an error', () => {
  const result = transformDataset(makeCollection([makeFeature({}, null)]));

  assert.equal(result.products.length, 0);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /coordinates/i);
});

test('transformDataset skips features whose coordinates are not a [lon, lat] pair', () => {
  const result = transformDataset(
    makeCollection([makeFeature({}, { type: 'Point', coordinates: [110.4] })]),
  );

  assert.equal(result.products.length, 0);
  assert.equal(result.skippedCount, 1);
  assert.match(result.errors[0].reason, /coordinates/i);
});

test('transformDataset collects validation errors for malformed properties without throwing', () => {
  // `cost` must be an integer; a string fails Zod validation.
  const bad = makeFeature({ cost: 'free' });
  const good = makeFeature({ product_key: 2 });

  const result = transformDataset(makeCollection([bad, good]));

  assert.equal(result.products.length, 1, 'the valid feature still transforms');
  assert.equal(result.products[0].product_key, 2);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.errors.length, 1);
});

test('transformDataset applies a default recency of 135 when the source omits it', () => {
  const feature = makeFeature();
  delete (feature.properties as Record<string, unknown>).recency;

  const result = transformDataset(makeCollection([feature]));

  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].recency_days, 135);
});

test('transformDataset falls back to "Unknown" for an empty category or segment', () => {
  const result = transformDataset(
    makeCollection([makeFeature({ category: '', product_segment: '' })]),
  );

  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].category, 'Unknown');
  assert.equal(result.products[0].segment, 'Unknown');
});

test('transformDataset extracts a location name from a recognised property', () => {
  const result = transformDataset(
    makeCollection([makeFeature({ location_name: 'Yogyakarta' })]),
  );

  assert.equal(result.products[0].location_name, 'Yogyakarta');
});
