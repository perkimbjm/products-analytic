-- Phase 5A: Add Missing Indexes
-- Purpose: Optimize query performance for name search and temporal queries
-- Risk: None (non-blocking DDL, can be added to live database)

-- Index for product name search
-- Use case: Search products by name (currently FULL TABLE SCAN)
-- Benefit: Enable fast substring and equality queries on product name
CREATE INDEX IF NOT EXISTS idx_product_name ON product(name);

-- Index for temporal queries
-- Use case: Get products created in last N days, sort by recent first
-- Benefit: Enable fast date range queries and temporal analytics
CREATE INDEX IF NOT EXISTS idx_product_created ON product(created_at DESC);

-- Index for import status filtering
-- Use case: Filter import runs by status (success, partial, failed)
-- Benefit: Enable fast filtering without full table scan
CREATE INDEX IF NOT EXISTS idx_import_run_status ON import_run(status);
