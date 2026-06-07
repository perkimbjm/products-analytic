import { productRepository } from '../repositories/product.js';
import type { Category, Segment, Location } from '../types/index.js';

/**
 * In-memory cache of the static lookup tables (category, segment, location).
 *
 * These are effectively read-only after ingestion, yet enrichment of every
 * product list/detail request previously re-queried and re-materialised all
 * three tables. We build the maps once (lazily, on first use) and reuse them.
 *
 * `getById`-style maps replace the prior O(n) `.find()` scans with O(1) lookups.
 * Call {@link invalidateLookups} after a re-import/seed if the process that
 * mutates the tables is the same long-lived process serving requests.
 */
interface LookupTables {
  categories: Map<number, Category>;
  segments: Map<number, Segment>;
  locations: Map<number, Location>;
}

let cache: LookupTables | null = null;

function buildLookups(): LookupTables {
  return {
    categories: new Map(productRepository.getCategories().map((c) => [c.id, c])),
    segments: new Map(productRepository.getSegments().map((s) => [s.id, s])),
    locations: new Map(productRepository.getLocations().map((l) => [l.id, l])),
  };
}

export function getLookups(): LookupTables {
  if (!cache) {
    cache = buildLookups();
  }
  return cache;
}

/** Drop the cached lookup tables; the next {@link getLookups} rebuilds them. */
export function invalidateLookups(): void {
  cache = null;
}
