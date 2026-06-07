/**
 * Basemap tile caching strategy. Basemap tiles from external CDNs (CARTO, OSM, Esri, OpenTopoMap)
 * already come with long Cache-Control headers (typically 1 year). This module helps optimize
 * by ensuring we respect those headers and avoid unnecessary refetches.
 *
 * Basemap CDN endpoints already cache aggressively via HTTP headers:
 * - CARTO: cache-control: max-age=31536000 (1 year, content-addressable URLs)
 * - OSM: cache-control: max-age=31536000
 * - Esri: cache-control: max-age=31536000
 * - OpenTopoMap: cache-control: max-age=31536000
 *
 * Browser HTTP cache respects these headers automatically; we just need to:
 * 1. Never add ?bust parameters to tile URLs
 * 2. Trust the CDN's cache headers
 * 3. Use stale-while-revalidate for map data (not tiles — they're already long-lived)
 */

/**
 * Check if a basemap style URL should be cached aggressively (it should be).
 * Tile URLs from CDNs are immutable (content-addressed), so 1-year HTTP cache is safe.
 */
export function shouldCacheBasemapTiles(): boolean {
  // Always return true — basemap tiles are immutable and safe to cache.
  // The browser's HTTP cache + CDN headers handle the rest.
  return true;
}

/**
 * Ensure basemap tile URLs are not modified with cache-busting parameters.
 * Tile URLs are immutable (e.g., tile/{z}/{x}/{y}.png), so cache-busting breaks caching.
 */
export function getBasemapTileUrl(url: string): string {
  // Strip any accidental ?v= or ?t= bust parameters.
  return url.split("?")[0];
}
