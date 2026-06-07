# Product Analysis Dashboard - Backend API

Backend untuk Product Analysis Dashboard yang menyediakan REST API untuk visualisasi data produk, analitik, dan integrasi GIS.


**Total Endpoints:** 18

---

## 📋 Stack Backend

### Runtime & Framework
- **Node.js** 20+
- **TypeScript** 5.x (strict mode)
- **Express.js** 4.x (REST API framework)

### Database
- **SQLite** 3 (data persistence)
- **better-sqlite3** (type-safe database driver)

### Libraries & Tools
- **Zod** - Schema validation
- **tsx** - TypeScript executor
- **pino** - Logging (minimal setup)

### Development
- **npm** - Package manager
- **git** - Version control

---

## 🚀 Cara Menjalankan Project

### Prerequisites
```bash
# Verifikasi instalasi
node --version    # v20+
npm --version     # v10+
```

### Setup Awal

```bash
# 1. Masuk ke folder backend
cd /backend

# 2. Install dependencies
npm install

# 3. Buat database dan jalankan migrations
npm run migrate

# 4. Seed sample data (opsional)
npm run seed
```

### Development Mode

```bash
# Jalankan development server (auto-reload)
npm run dev

# Server berjalan di: http://localhost:3000
# API base URL: http://localhost:3000/api
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Jalankan production server
npm start

# Atau custom port
PORT=8000 npm start
```

### Verify Installation

```bash
# Type checking
npm run typecheck

# Jalankan migrations
npm run migrate

# Seed data
npm run seed

# Test health endpoint
curl http://localhost:3000/api/health
# Response: {"status":"ok"}
```

---

## 📌 Asumsi yang Digunakan

### Data & Database
- **Single SQLite Database** - Setiap instalasi memiliki satu file database (`data/app.sqlite`)
- **Import Run Tracking** - Sistem melacak kapan data terakhir diimpor
- **Fixed Lookup Values** - Kategori dan segment adalah data referensi yang tidak sering berubah:
  - Categories: Accessories, Clothing, Bikes
  - Segments: High-Performer, mid-range, Low-Performer

### Location Data
- **Koordinat Wajib** - Setiap produk harus memiliki latitude/longitude
- **Unique by Coordinates** - Tidak ada duplikasi lokasi berdasarkan lat/lng
- **Optional Location Name** - Nama lokasi bersifat opsional (dapat NULL)

### Product Data
- **Unique by (product_key, location_id)** - Satu produk tidak boleh muncul 2x di lokasi yang sama
- **All Metrics in IDR** - Semua nilai mata uang dalam Indonesian Rupiah (IDR)
- **Non-negative Values** - Cost, orders, sales, customers harus >= 0
- **Historical Data** - Data tidak dihapus, hanya di-update

### API & Requests
- **Stateless** - Setiap request berdiri sendiri, tidak ada session
- **No Authentication** - API terbuka (production harus menambahkan auth)
- **No Real-time Updates** - Menggunakan polling, bukan WebSocket
- **Pagination** - Default limit 50, maximum 10000 (untuk GeoJSON export)

### Performance
- **Single-threaded Execution** - Node.js single-threaded event loop
- **In-Memory Processing** - Aggregasi dilakukan di database, bukan in-memory
- **Caching via HTTP** - Rely on browser/CDN caching, bukan Redis
- **Scale Limit** - Optimal untuk ~1M rows, scalability options di dokumentasi

### Frontend Integration
- **TypeScript Support** - All data shapes documented in TypeScript
- **DTO Pattern** - API mengembalikan Data Transfer Objects (bukan raw DB rows)
- **camelCase Naming** - Semua field API menggunakan camelCase
- **No Foreign Key IDs** - Frontend tidak perlu tahu tentang database structure

---

## 🔌 18 Endpoints & Fungsi di Frontend

### 1. Health Check (1 endpoint)

#### `GET /api/health`
**Fungsi Frontend:** Verifikasi backend connectivity  
**Digunakan untuk:** 
- Health check saat app startup
- Monitor backend status
- Detect server down

---

### 2. Products (4 endpoints)

#### `GET /api/products`
**Fungsi Frontend:** Tampilkan daftar produk dengan pagination  
**Digunakan untuk:**
- Product list page/table
- Search dan filter produk
- Pagination controls

**Query Parameters:**
- `limit` (default: 50) - Jumlah produk per halaman
- `offset` (default: 0) - Posisi mulai
- `search` - Cari by nama produk
- `categories` - Filter by kategori (comma-separated)
- `segments` - Filter by segment (comma-separated)
- `minCost` - Filter harga minimum
- `maxCost` - Filter harga maksimum


---

#### `GET /api/products/:id`
**Fungsi Frontend:** Tampilkan detail produk lengkap  
**Digunakan untuk:**
- Product detail modal/drawer
- Product detail page
- Show full product information


---

#### `GET /api/products/locations`
**Fungsi Frontend:** Dapatkan daftar lokasi untuk reference  
**Digunakan untuk:**
- Location dropdown/autocomplete
- Map legend
- Location grouping

---

#### `GET /api/products/geojson`
**Fungsi Frontend:** Export produk sebagai GeoJSON  
**Digunakan untuk:**
- Import ke QGIS/ArcGIS
- Export untuk analisis eksternal
- GIS tools integration

**Query Parameters:** Same as GET /api/products (filters supported)

---

### 3. Analytics (8 endpoints)

#### `GET /api/analytics/dashboard`
**Fungsi Frontend:** Load dashboard dengan satu request ⭐ OPTIMIZED  
**Digunakan untuk:**
- Dashboard initialization
- Load KPI cards
- Load semua chart sekaligus

---

#### `GET /api/analytics/map-points`
**Fungsi Frontend:** Render map dengan data optimized
**Digunakan untuk:**
- MapLibre point rendering
- Map clustering
- Interactive map markers

**Query Parameters:** Same as /api/products (filters supported)


---

#### `GET /api/analytics/top-products`
**Fungsi Frontend:** Tampilkan produk top sellers  
**Digunakan untuk:**
- Leaderboard widget
- "Best Performers" table
- Dashboard rankings

**Query Parameters:**
- `limit` (default: 10) - Jumlah top products

---

#### `GET /api/analytics/category`
**Fungsi Frontend:** Category breakdown untuk bar chart  
**Digunakan untuk:**
- Category sales chart
- Category distribution visualization

**Query Parameters:** Same as /api/products (filters supported)

---

#### `GET /api/analytics/segment`
**Fungsi Frontend:** Segment breakdown untuk chart  
**Digunakan untuk:**
- Segment distribution visualization
- Pie/donut chart data

**Query Parameters:** Same as /api/products (filters supported)

---

#### `GET /api/analytics/cost`
**Fungsi Frontend:** Cost histogram untuk distribution analysis  
**Digunakan untuk:**
- Histogram chart
- Price distribution visualization

**Query Parameters:**
- `bins` (default: 8) - Jumlah bins histogram
- Plus filters dari /api/products

---

#### `GET /api/analytics/maintenance`
**Fungsi Frontend:** Product freshness stats  
**Digunakan untuk:**
- Maintenance status dashboard
- "Last sale" visualization
- Data freshness indicator

**Query Parameters:** Same as /api/products (filters supported)


**Logika:**
- **Healthy:** Terakhir dijual <= 30 hari
- **Warning:** Terakhir dijual 31-90 hari
- **Critical:** Terakhir dijual > 90 hari

---

### 4. Metadata (5 endpoints)

#### `GET /api/meta/filters`
**Fungsi Frontend:** Load filter options untuk UI  
**Digunakan untuk:**
- Populate category dropdown
- Populate segment dropdown
- Filter initialization


---

#### `GET /api/meta/freshness`
**Fungsi Frontend:** Tampilkan kapan data terakhir diimport  
**Digunakan untuk:**
- Data freshness indicator
- "Last updated" badge
- Import tracking

---

#### `GET /api/meta/categories`
**Fungsi Frontend:** Dapatkan daftar kategori  
**Digunakan untuk:**
- Reference data
- Category management

---

#### `GET /api/meta/segments`
**Fungsi Frontend:** Dapatkan daftar segment  
**Digunakan untuk:**
- Reference data
- Segment management

## 📊 Frontend Integration Guide

### Dashboard Page
```typescript
// Load sekali saat page mount
const response = await fetch('/api/analytics/dashboard');
const dashboard = await response.json();

// Render semua chart dari 1 response
renderKPICards(dashboard.data.kpis);
renderCategoryChart(dashboard.data.categoryBreakdown);
renderSegmentChart(dashboard.data.segmentBreakdown);
renderTopProductsTable(dashboard.data.topProducts);
```

### Map Page
```typescript
// Load map points (optimized untuk map)
const response = await fetch('/api/analytics/map-points');
const points = await response.json();

// Render directly di MapLibre
points.data.forEach(point => {
  map.addLayer({
    id: `product-${point.id}`,
    type: 'circle',
    paint: {
      'circle-radius': Math.log(point.sales) / 10,
    }
  });
});
```

### Product List Page
```typescript
// Load products dengan pagination
const response = await fetch('/api/products?limit=20&offset=0');
const products = await response.json();

// Render table
products.data.forEach(p => {
  table.addRow({
    name: p.name,
    category: p.category,
    sales: p.metrics.sales
  });
});

// Handle pagination
const totalPages = Math.ceil(products.meta.total / products.meta.limit);
```

### Filters
```typescript
// Load filter options sekali
const filters = await fetch('/api/meta/filters').then(r => r.json());

// Apply selected filters
const selected = { categories: ['Accessories'], segments: ['mid-range'] };
const query = new URLSearchParams();
query.append('categories', selected.categories.join(','));
query.append('segments', selected.segments.join(','));

const products = await fetch(`/api/products?${query}`).then(r => r.json());
```

---


## 🔒 Security Notes

### ✅ Implemented
- Parameterized queries (no SQL injection)
- Input validation with Zod
- Proper error messages (no leaks)
- Type safety (TypeScript)

### ⚠️ Not Implemented (Production TODO)
- Authentication/Authorization
- Rate limiting
- CORS configuration
- Input sanitization
- HTTPS enforcement

### Production Setup
```bash
# Setup environment variables
export NODE_ENV=production
export PORT=3000

# Add CORS middleware
app.use(cors({ origin: 'https://yourdomain.com' }));

# Add rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

## 📝 Keterangan Tambahan

### Migration History
```
001_init_spatial.sql         → Create base tables
002_seed_lookups.sql         → Seed lookup values
003_create_product.sql       → Create fact table
004_create_import_run.sql    → Create tracking table
005_finalize_schema.sql      → Schema stability
006_add_missing_indexes.sql  → Performance optimization
```


### Environment Variables (Optional)
```bash
NODE_ENV=production      # production, development
PORT=3000               # Server port
LOG_LEVEL=info          # debug, info, warn, error
DATABASE_PATH=data/app.sqlite
```

### Common Issues & Solutions

**Problem:** "Cannot find module 'express'"
```bash
# Solution: Install dependencies
npm install
```

**Problem:** "SQLITE_CANTOPEN: unable to open database file"
```bash
# Solution: Run migrations first
npm run migrate
```

**Problem:** "Port 3000 already in use"
```bash
# Solution: Change port
PORT=3001 npm run dev
```

**Problem:** TypeScript errors
```bash
# Solution: Type check
npm run typecheck
```

### Scaling Recommendations

**Current Setup:** Suitable for ~1M rows  
**Next Level:** PostgreSQL + Redis caching  
**Large Scale:** Distributed database + microservices


**Docker:**
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run migrate
CMD npm start
```

---


## ✅ Checklist Sebelum Production

- [ ] Setup authentication/authorization
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Setup rate limiting
- [ ] Configure database backups
- [ ] Enable logging & monitoring
- [ ] Test all 18 endpoints
- [ ] Load test dengan sample data
- [ ] Security audit
- [ ] Performance testing

---

---

**Last Updated:** 2026-06-05

