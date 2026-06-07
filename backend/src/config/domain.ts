// Maintenance health thresholds (days since last sale).
export const MAINTENANCE_THRESHOLDS = {
  HEALTHY: 30,
  WARNING: 90,
  // Critical: > 90 days
} as const;

// Cost histogram configuration (equal-width auto-binning).
export const HISTOGRAM_CONFIG = {
  BIN_COUNT: 8, // Default bin count; can be adjusted by analytics query
  STRATEGY: 'equal-width', // Alternative: 'quantile' (not yet implemented)
} as const;

/** Compute days between a date string and today. */
function daysSince(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  // Zero out time components for a pure date diff.
  then.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - then.getTime()) / 86_400_000);
}

// Derived maintenance status from a Date string (ISO date).
export function getMaintenanceStatus(recencyDate: string): 'healthy' | 'warning' | 'critical' {
  const days = daysSince(recencyDate);
  if (days <= MAINTENANCE_THRESHOLDS.HEALTHY) return 'healthy';
  if (days <= MAINTENANCE_THRESHOLDS.WARNING) return 'warning';
  return 'critical';
}
