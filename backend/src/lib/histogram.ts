// Pure cost-histogram math (equal-width auto-binning).
// Extracted from AnalyticsRepository so the binning logic is testable without a DB.
// Property (AC-012): the per-bin counts always partition the same population, so
// the sum of bin counts equals the population total.

export interface BinRange {
  min: number;
  max: number;
}

export interface HistogramBin extends BinRange {
  count: number;
  percentage: number;
}

/**
 * Build `binCount` contiguous equal-width integer bins spanning [min, max].
 *
 * Bins are inclusive on both ends and non-overlapping (each bin starts one unit
 * past the previous bin's max). The final bin always ends exactly at `max` so
 * the maximum value is never dropped by integer-width rounding.
 */
export function buildBinRanges(min: number, max: number, binCount: number): BinRange[] {
  if (binCount <= 0) return [];

  const binWidth = Math.ceil((max - min + 1) / binCount);
  const ranges: BinRange[] = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = i === binCount - 1 ? max : binMin + binWidth - 1;
    ranges.push({ min: binMin, max: binMax });
  }

  return ranges;
}

/**
 * Combine bin ranges with their counts and a population total into display bins,
 * computing each bin's percentage of the total (rounded to a whole percent).
 */
export function toHistogramBins(
  ranges: BinRange[],
  counts: number[],
  total: number,
): HistogramBin[] {
  return ranges.map((range, i) => {
    const count = counts[i] ?? 0;
    return {
      min: range.min,
      max: range.max,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}
