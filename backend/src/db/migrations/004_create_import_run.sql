-- Create import_run provenance/freshness table
CREATE TABLE IF NOT EXISTS import_run (
  id            INTEGER PRIMARY KEY,
  source        TEXT NOT NULL DEFAULT 'mapid_dataset',
  source_url    TEXT,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  status        TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  record_count  INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_run_finished ON import_run(finished_at DESC);
