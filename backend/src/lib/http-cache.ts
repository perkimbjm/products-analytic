import type { Request, Response, NextFunction } from 'express';

/**
 * Cache lifetimes (seconds) for semi-static GET endpoints.
 *
 * The data only changes on a re-import/seed, so the browser can safely reuse a
 * response for a while. Express's built-in (weak) ETag still enables a cheap 304
 * revalidation once the window expires.
 */
export const CACHE_STATIC_MAX_AGE = 300; // lookup tables: categories, segments, locations
export const CACHE_SEMI_STATIC_MAX_AGE = 60; // aggregations / freshness

/**
 * Middleware that adds `Cache-Control: public, max-age=<n>` to **successful**
 * (2xx) JSON responses only.
 *
 * It wraps `res.json` so error responses (4xx/5xx) are never cached — a transient
 * DB failure must not be frozen for the cache lifetime. Apply per-router/route.
 */
export function cacheControl(maxAgeSeconds: number) {
  const headerValue = `public, max-age=${maxAgeSeconds}`;

  return (_req: Request, res: Response, next: NextFunction): void => {
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.setHeader('Cache-Control', headerValue);
      }
      return sendJson(body);
    };
    next();
  };
}
