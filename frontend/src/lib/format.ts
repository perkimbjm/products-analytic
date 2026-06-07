/** Shared display formatters. */

/** Compact USD: 1.2M / 34K / 980 */
export function formatUSD(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}

/** Full accounting USD: $ 1.400.000 */
export function formatUSDAccounting(val: number): string {
  return `$ ${Math.round(val).toLocaleString("en-US")}`;
}

/** Thousands-separated integer. */
export function formatNumber(val: number): string {
  return Math.round(val).toLocaleString();
}

// Legacy aliases for backward compatibility
export const formatUsd = formatUSD;
export const formatUsdAccounting = formatUSDAccounting;
