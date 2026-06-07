-- Create product fact table
CREATE TABLE IF NOT EXISTS product (
  id                        INTEGER PRIMARY KEY,
  product_key               INTEGER,
  name                      TEXT NOT NULL,
  category_id               INTEGER NOT NULL REFERENCES category(id),
  segment_id                INTEGER NOT NULL REFERENCES segment(id),
  location_id               INTEGER NOT NULL REFERENCES location(id),
  sub_category              TEXT,
  cost_idr                  INTEGER NOT NULL,
  total_orders              INTEGER NOT NULL DEFAULT 0,
  total_quantity            INTEGER NOT NULL DEFAULT 0,
  total_sales_idr           INTEGER NOT NULL DEFAULT 0,
  total_customers           INTEGER NOT NULL DEFAULT 0,
  avg_selling_price_idr     INTEGER NOT NULL DEFAULT 0,
  avg_order_revenue_idr     REAL NOT NULL DEFAULT 0,
  avg_monthly_revenue_idr   REAL NOT NULL DEFAULT 0,
  last_sale_date            TEXT NOT NULL,
  recency_days              INTEGER NOT NULL DEFAULT 0,
  imported_at               TEXT NOT NULL DEFAULT (datetime('now')),
  created_at                TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product_key, location_id)
);

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_segment  ON product(segment_id);
CREATE INDEX IF NOT EXISTS idx_product_location ON product(location_id);
CREATE INDEX IF NOT EXISTS idx_product_lastsale ON product(last_sale_date);
CREATE INDEX IF NOT EXISTS idx_product_cost     ON product(cost_idr);
CREATE INDEX IF NOT EXISTS idx_product_subcategory ON product(sub_category);
CREATE INDEX IF NOT EXISTS idx_product_recency ON product(recency_days);
