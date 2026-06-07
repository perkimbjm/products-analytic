-- Phase 5: Composite indexes + FTS5
-- 5.1 Composite indexes for common filter combinations
-- 5.2 FTS5 virtual table for fast full-text search

-- Composite index: category + segment (most common filter pair)
-- Covers: WHERE category_id IN (...) AND segment_id IN (...)
CREATE INDEX IF NOT EXISTS idx_product_cat_seg ON product(category_id, segment_id);

-- Composite index: category + segment + cost (filtered product listing)
-- Covers: WHERE category_id IN (...) AND segment_id IN (...) AND cost_idr BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_product_cat_seg_cost ON product(category_id, segment_id, cost_idr);

-- Composite index: segment + cost (second most common combo)
CREATE INDEX IF NOT EXISTS idx_product_seg_cost ON product(segment_id, cost_idr);

-- 5.2 FTS5 virtual table for full-text search on name + sub_category
-- Replaces slow LIKE '%term%' with indexed FTS5 MATCH queries
CREATE VIRTUAL TABLE IF NOT EXISTS product_fts USING fts5(
  name,
  sub_category,
  content='product',
  content_rowid='id',
  tokenize='unicode61'
);

-- Populate FTS from existing product data
INSERT OR IGNORE INTO product_fts(rowid, name, sub_category)
  SELECT id, name, sub_category FROM product;

-- Triggers to keep FTS in sync on INSERT/UPDATE/DELETE
CREATE TRIGGER IF NOT EXISTS product_ai AFTER INSERT ON product BEGIN
  INSERT INTO product_fts(rowid, name, sub_category)
    VALUES (new.id, new.name, new.sub_category);
END;

CREATE TRIGGER IF NOT EXISTS product_ad AFTER DELETE ON product BEGIN
  INSERT INTO product_fts(product_fts, rowid, name, sub_category)
    VALUES ('delete', old.id, old.name, old.sub_category);
END;

CREATE TRIGGER IF NOT EXISTS product_au AFTER UPDATE ON product BEGIN
  INSERT INTO product_fts(product_fts, rowid, name, sub_category)
    VALUES ('delete', old.id, old.name, old.sub_category);
  INSERT INTO product_fts(rowid, name, sub_category)
    VALUES (new.id, new.name, new.sub_category);
END;
