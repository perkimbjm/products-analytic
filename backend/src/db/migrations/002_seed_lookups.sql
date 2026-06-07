-- Seed fixed category values
INSERT OR IGNORE INTO category (id, name) VALUES
  (1, 'Accessories'),
  (2, 'Clothing'),
  (3, 'Bikes');

-- Seed fixed segment values
INSERT OR IGNORE INTO segment (id, name) VALUES
  (1, 'High-Performer'),
  (2, 'mid-range'),
  (3, 'Low-Performer');

-- Seed special "Unknown" values for missing data
INSERT OR IGNORE INTO category (id, name) VALUES (999, 'Unknown');
INSERT OR IGNORE INTO segment (id, name) VALUES (999, 'Unknown');
