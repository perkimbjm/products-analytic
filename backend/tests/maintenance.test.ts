import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getMaintenanceStatus, MAINTENANCE_THRESHOLDS } from '../src/config/domain.js';

// Build a 'YYYY-MM-DD' string for the local calendar date `n` days before today.
// We format from local components (not toISOString, which would shift the date by
// the UTC offset) so the string round-trips with how getMaintenanceStatus computes
// day differences against the local "now".
function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

test('a sale today is healthy', () => {
  assert.equal(getMaintenanceStatus(daysAgo(0)), 'healthy');
});

test('exactly at the healthy threshold (30 days) is still healthy', () => {
  assert.equal(getMaintenanceStatus(daysAgo(MAINTENANCE_THRESHOLDS.HEALTHY)), 'healthy');
});

test('one day past the healthy threshold (31 days) is warning', () => {
  assert.equal(getMaintenanceStatus(daysAgo(MAINTENANCE_THRESHOLDS.HEALTHY + 1)), 'warning');
});

test('exactly at the warning threshold (90 days) is still warning', () => {
  assert.equal(getMaintenanceStatus(daysAgo(MAINTENANCE_THRESHOLDS.WARNING)), 'warning');
});

test('one day past the warning threshold (91 days) is critical', () => {
  assert.equal(getMaintenanceStatus(daysAgo(MAINTENANCE_THRESHOLDS.WARNING + 1)), 'critical');
});

test('a long-stale sale is critical', () => {
  assert.equal(getMaintenanceStatus(daysAgo(135)), 'critical');
});
