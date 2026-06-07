import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildBinRanges, toHistogramBins } from '../src/lib/histogram.js';

test('buildBinRanges produces exactly binCount bins', () => {
  const ranges = buildBinRanges(1, 100, 8);
  assert.equal(ranges.length, 8);
});

test('buildBinRanges spans the full [min, max] range', () => {
  const ranges = buildBinRanges(1, 100, 8);
  assert.equal(ranges[0].min, 1);
  assert.equal(ranges[ranges.length - 1].max, 100, 'final bin ends exactly at max');
});

test('buildBinRanges yields contiguous, non-overlapping bins', () => {
  const ranges = buildBinRanges(1, 100, 8);
  for (let i = 1; i < ranges.length; i++) {
    assert.equal(ranges[i].min, ranges[i - 1].max + 1, `bin ${i} starts one past bin ${i - 1}`);
  }
});

test('buildBinRanges handles a single-value population (min === max)', () => {
  const ranges = buildBinRanges(1555, 1555, 8);
  assert.equal(ranges.length, 8);
  // Every value falls in the first bin; later bins are degenerate but valid.
  assert.equal(ranges[0].min, 1555);
  assert.equal(ranges[ranges.length - 1].max, 1555);
});

test('buildBinRanges returns no bins for a non-positive binCount', () => {
  assert.deepEqual(buildBinRanges(1, 100, 0), []);
});

test('toHistogramBins counts sum to the population total (AC-012)', () => {
  const ranges = buildBinRanges(1, 100, 4);
  const counts = [10, 25, 40, 25]; // sums to 100
  const total = 100;

  const bins = toHistogramBins(ranges, counts, total);

  const sum = bins.reduce((acc, b) => acc + b.count, 0);
  assert.equal(sum, total);
});

test('toHistogramBins computes whole-percent shares of the total', () => {
  const ranges = buildBinRanges(1, 100, 4);
  const bins = toHistogramBins(ranges, [10, 25, 40, 25], 100);

  assert.deepEqual(
    bins.map((b) => b.percentage),
    [10, 25, 40, 25],
  );
});

test('toHistogramBins treats missing counts as zero', () => {
  const ranges = buildBinRanges(1, 100, 4);
  const bins = toHistogramBins(ranges, [10], 10);

  assert.deepEqual(
    bins.map((b) => b.count),
    [10, 0, 0, 0],
  );
});

test('toHistogramBins reports 0% for every bin when the total is zero', () => {
  const ranges = buildBinRanges(1, 100, 4);
  const bins = toHistogramBins(ranges, [0, 0, 0, 0], 0);

  assert.ok(bins.every((b) => b.percentage === 0));
});
