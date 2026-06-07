/**
 * Parse duration strings like "5m", "10m", "30d" into milliseconds.
 * Used for TanStack Query cache configuration.
 */
function parseDuration(input: string): number {
  const match = input.toLowerCase().match(/^(\d+)([mhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${input}. Use 5m, 10m, 30d, etc.`);

  const [, amount, unit] = match;
  const num = parseInt(amount, 10);

  switch (unit) {
    case "m":
      return num * 60 * 1000; // minutes to ms
    case "h":
      return num * 60 * 60 * 1000; // hours to ms
    case "d":
      return num * 24 * 60 * 60 * 1000; // days to ms
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Cache configuration from environment variables.
 * Defaults are safe for demo/dev; production should tune based on data freshness needs.
 */
export const CACHE_CONFIG = {
  // How long before data is considered "stale" and will refetch in background.
  // Shorter = fresher data but more network traffic.
  staleTime: parseDuration(import.meta.env.VITE_CACHE_STALE_TIME || "5m"),

  // How long to keep unused data in memory before garbage collection.
  // Longer = better experience when navigating back, but uses more RAM.
  gcTime: parseDuration(import.meta.env.VITE_CACHE_GC_TIME || "10m"),

  // Tile cache TTL for basemaps (browser HTTP cache, not in-memory).
  // Basemap tiles change rarely, so 30d is safe.
  basemapTTL: parseDuration(import.meta.env.VITE_CACHE_BASEMAP_TTL || "30d"),
};
