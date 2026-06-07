import { getDatabase } from '../db/connection.js';
import { Product, Category, Segment, Location } from '../types/index.js';

/**
 * Build an FTS5 MATCH expression for substring-like search.
 * Appends `*` to each token so "ipho" matches "iphone" via prefix search.
 * Falls back to LIKE for single-character queries where FTS5 prefix is meaningless.
 */
function buildFtsQuery(term: string): string {
  const trimmed = term.trim();
  if (trimmed.length < 2) return '';
  // FTS5 prefix match: each word becomes a prefix token
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}*`)
    .join(' ');
}

export interface ProductFilter {
  categories?: string[];
  segments?: string[];
  search?: string;
  minCost?: number;
  maxCost?: number;
  limit?: number;
  offset?: number;
  /** `<field>:<dir>`, e.g. `cost:desc`. Whitelisted in {@link SORTABLE_COLUMNS}. */
  sort?: string;
}

/**
 * Maps client sort keys to ORDER BY expressions; anything else falls back to name.
 * Values are hardcoded SQL fragments (never user input), so interpolating them is
 * injection-safe. `category`/`segment` sort by the related name via correlated
 * subqueries; `margin` mirrors the UI formula ((price − cost) / price) with a
 * divide-by-zero guard.
 */
const SORTABLE_COLUMNS: Record<string, string> = {
  name: 'name',
  cost: 'cost_idr',
  sales: 'total_sales_idr',
  orders: 'total_orders',
  quantity: 'total_quantity',
  customers: 'total_customers',
  category: '(SELECT name FROM category WHERE category.id = product.category_id)',
  segment: '(SELECT name FROM segment WHERE segment.id = product.segment_id)',
  margin:
    '(CASE WHEN avg_selling_price_idr > 0 ' +
    'THEN (avg_selling_price_idr - cost_idr) * 1.0 / avg_selling_price_idr ELSE 0 END)',
};

export function buildOrderBy(sort?: string): string {
  if (!sort) return 'ORDER BY name ASC';
  const [field, dir] = sort.split(':');
  const column = SORTABLE_COLUMNS[field];
  if (!column) return 'ORDER BY name ASC';
  const direction = dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  // Stable tiebreaker so equal values (e.g. same category) keep a deterministic order.
  return `ORDER BY ${column} ${direction}, name ASC`;
}

export interface ProductWithRelations extends Product {
  category?: Category;
  segment?: Segment;
  location?: Location;
}

export class ProductRepository {
  getAll(filter?: ProductFilter): Product[] {
    const db = getDatabase();

    let sql = 'SELECT * FROM product WHERE 1=1';
    const params: unknown[] = [];

    if (filter?.categories && filter.categories.length > 0) {
      const placeholders = filter.categories.map(() => '?').join(',');
      sql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...filter.categories);
    }

    if (filter?.segments && filter.segments.length > 0) {
      const placeholders = filter.segments.map(() => '?').join(',');
      sql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...filter.segments);
    }

    if (filter?.search) {
      const ftsExpr = buildFtsQuery(filter.search);
      if (ftsExpr) {
        sql += ` AND product.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND (name LIKE ? OR sub_category LIKE ?)`;
        const searchTerm = `%${filter.search}%`;
        params.push(searchTerm, searchTerm);
      }
    }

    if (filter?.minCost !== undefined) {
      sql += ` AND cost_idr >= ?`;
      params.push(filter.minCost);
    }

    if (filter?.maxCost !== undefined) {
      sql += ` AND cost_idr <= ?`;
      params.push(filter.maxCost);
    }

    sql += ` ${buildOrderBy(filter?.sort)}`;

    if (filter?.limit) {
      sql += ` LIMIT ?`;
      params.push(filter.limit);

      if (filter?.offset) {
        sql += ` OFFSET ?`;
        params.push(filter.offset);
      }
    }

    const stmt = db.prepare(sql);
    return stmt.all(...params) as Product[];
  }

  count(filter?: ProductFilter): number {
    const db = getDatabase();

    let sql = 'SELECT COUNT(*) as count FROM product WHERE 1=1';
    const params: unknown[] = [];

    if (filter?.categories && filter.categories.length > 0) {
      const placeholders = filter.categories.map(() => '?').join(',');
      sql += ` AND category_id IN (SELECT id FROM category WHERE name IN (${placeholders}))`;
      params.push(...filter.categories);
    }

    if (filter?.segments && filter.segments.length > 0) {
      const placeholders = filter.segments.map(() => '?').join(',');
      sql += ` AND segment_id IN (SELECT id FROM segment WHERE name IN (${placeholders}))`;
      params.push(...filter.segments);
    }

    if (filter?.search) {
      const ftsExpr = buildFtsQuery(filter.search);
      if (ftsExpr) {
        sql += ` AND product.id IN (SELECT rowid FROM product_fts WHERE product_fts MATCH ?)`;
        params.push(ftsExpr);
      } else {
        sql += ` AND (name LIKE ? OR sub_category LIKE ?)`;
        const searchTerm = `%${filter.search}%`;
        params.push(searchTerm, searchTerm);
      }
    }

    if (filter?.minCost !== undefined) {
      sql += ` AND cost_idr >= ?`;
      params.push(filter.minCost);
    }

    if (filter?.maxCost !== undefined) {
      sql += ` AND cost_idr <= ?`;
      params.push(filter.maxCost);
    }

    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as { count: number };
    return row.count;
  }

  getById(id: number): Product | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM product WHERE id = ?');
    return stmt.get(id) as Product | undefined;
  }

  getByKey(productKey: number, locationId: number): Product | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM product WHERE product_key = ? AND location_id = ?');
    return stmt.get(productKey, locationId) as Product | undefined;
  }

  getCategories(): Category[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM category WHERE name != ? ORDER BY name');
    return stmt.all('Unknown') as Category[];
  }

  getSegments(): Segment[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM segment WHERE name != ? ORDER BY name');
    return stmt.all('Unknown') as Segment[];
  }

  getLocations(): Location[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, name, latitude, longitude, created_at FROM location ORDER BY id');
    return stmt.all() as Location[];
  }

  rebuildFtsIndex(): void {
    const db = getDatabase();
    db.exec("INSERT INTO product_fts(product_fts) VALUES('rebuild')");
  }
}

export const productRepository = new ProductRepository();
