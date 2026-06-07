# ─────────────────────────────────────────────────────────────────────────────
# Product Analysis Dashboard — Backend Dockerfile
#
# Strategy: two-stage build.
#   Stage 1 (builder): compile TypeScript, run migrate + seed, bake the SQLite
#     DB into the image so the production container starts with data immediately.
#   Stage 2 (production): minimal image with only production deps + compiled JS
#     + the seeded DB.
#
# Ephemeral-filesystem recovery (RISK-010): if Railway restarts the container and
# wipes the filesystem, startup.sh re-migrates and re-seeds before starting the
# Express server. The seed data (data/seed/sample.json) is included in the image.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first — layer is cached unless package.json changes
COPY package*.json ./
RUN npm ci

# Copy all source files (node_modules excluded via .dockerignore)
COPY . .

# Compile TypeScript → dist/
RUN npm run build

# Copy SQL migration files alongside the compiled JS.
# The migration runner resolves migrations via import.meta.url, which places
# them at dist/db/migrations/ relative to dist/db/migrate.js.
RUN mkdir -p dist/db/migrations
COPY src/db/migrations/ dist/db/migrations/

# Bake the database: run migrations then seed from the committed sample dataset.
# DATABASE_PATH must be absolute here (relative paths resolve from WORKDIR /app).
ENV DATABASE_PATH=/app/data/app.sqlite
RUN mkdir -p data && \
    node dist/db/migrate.js && \
    node dist/import/index.js seed


# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Production-only Node modules
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled application (includes dist/db/migrations/ copied in Stage 1)
COPY --from=builder /app/dist ./dist

# Seeded SQLite database + seed JSON (for ephemeral-filesystem recovery)
COPY --from=builder /app/data ./data

# ── Runtime configuration ─────────────────────────────────────────────────────
ENV NODE_ENV=production
# DATABASE_PATH must match where the DB was placed in Stage 1
ENV DATABASE_PATH=/app/data/app.sqlite
# PORT is typically injected by Railway; default 8080 for local docker run
ENV PORT=8080

EXPOSE 8080

# Startup script: re-creates the DB if the filesystem was wiped, then starts the server
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

CMD ["/startup.sh"]
