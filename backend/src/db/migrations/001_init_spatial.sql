-- Create category lookup table
CREATE TABLE IF NOT EXISTS category (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_name ON category(name);

-- Create segment lookup table
CREATE TABLE IF NOT EXISTS segment (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_segment_name ON segment(name);

-- Create location table
CREATE TABLE IF NOT EXISTS location (
  id         INTEGER PRIMARY KEY,
  name       TEXT,
  latitude   REAL NOT NULL,
  longitude  REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(latitude, longitude)
);

CREATE INDEX IF NOT EXISTS idx_location_latitude
ON location(latitude);

CREATE INDEX IF NOT EXISTS idx_location_longitude
ON location(longitude);