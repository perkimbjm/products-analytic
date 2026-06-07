#!/bin/sh
# startup.sh — production container entrypoint
#
# Railway (and other PaaS) can have ephemeral filesystems: if the container is
# restarted or migrated to a new host, any files written at runtime are wiped.
# Since the SQLite DB is baked into the Docker image at build time, it survives
# the initial deploy. But if the runtime filesystem is wiped (RISK-010), this
# script re-creates the DB before starting the server.
#
# Normal flow (DB exists): skip migration/seed → start server immediately.
# Recovery flow (DB missing): migrate → seed → start server.

set -e

DB_FILE="${DATABASE_PATH:-/app/data/app.sqlite}"

if [ ! -f "$DB_FILE" ]; then
  echo "[startup] Database not found at $DB_FILE — re-migrating and seeding..."
  mkdir -p "$(dirname "$DB_FILE")"
  node /app/dist/db/migrate.js
  node /app/dist/import/index.js seed
  echo "[startup] Database ready."
else
  echo "[startup] Database found at $DB_FILE."
fi

echo "[startup] Starting Express server on port ${PORT:-8080}..."
exec node /app/dist/index.js
