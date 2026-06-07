# Product Analysis Dashboard - Backend API

Backend untuk Product Analysis Dashboard yang menyediakan REST API untuk visualisasi data produk, analitik, dan integrasi GIS.


**Total Endpoints:** 17

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
- **compression** - gzip/brotli response compression
- **dotenv** - `.env` loading
- **undici** - HTTP client (dataset import only)
- **Custom logger** - Lightweight leveled console logger (`src/lib/logger.ts`); the project does **not** use pino

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
cd backend

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
curl http://localhost:3000/health
# Response: {"success":true,"data":{"status":"ok","timestamp":"...","version":"0.0.1"}}
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
- **Koordinat Sintetis (Indonesia)** - Titik koordinat pada dataset diletakkan di wilayah Indonesia (mis. Pulau Jawa, lat ≈ -7, lng ≈ 106) untuk keperluan demo GIS, sementara metrik penjualannya dengan angka yang sedikit tidak relevan dengan rupiah tapi menggunakan USD. Jadi geografi bersifat sintetis dan tidak terkait dengan mata uang. Titik koordinat juga dibirkan apa adanya walaupun banyak lokasi yang berada di laut

### Product Data
- **Unique by (product_key, location_id)** - Satu produk tidak boleh muncul 2x di lokasi yang sama
- **All Metrics in USD** - Semua nilai mata uang (cost, sales, avg selling price, dst.) dalam **US Dollar (USD)**, bukan Rupiah.

  **Alasan:** Dataset sumber dibiarkan apa adanya. Jika ini Rupiah, harga sebuah botol minum hanya Rp 5 — tidak masuk akal;

  **Catatan teknis:** Kolom database dan field internal masih memakai sufiks `_idr` (mis. `cost_idr`, `total_sales_idr`) sebagai *artefak penamaan lama* — nilainya tetap USD. API sendiri sudah currency-neutral: response mengembalikan nama field generik (`cost`, `sales`, `avgSellingPrice`, dst.) tanpa menyebut mata uang, sehingga tidak ada perubahan kontrak API.
- **Non-negative Values** - Cost, orders, sales, customers harus >= 0
- **Historical Data** - Data tidak dihapus, hanya di-update
- **Sesuai brief, dataset boleh dilakukan transformasi sehingga saya mengubah nama field dari time_spam menjadi time_span, dan data mid-rande menjadi mid-range, karena menurut saya itu typo. Sedangkan untuk data tahun, saya tidak mengubahnya

### Product Health / Maintenance Analysis
Brief membebaskan interpretasi kolom *maintenance / recency / product health*. Asumsi yang dipakai backend:

- **Dataset sumber = `last_sale_date`** - Status kesehatan produk dihitung dari **selisih hari antara hari ini dan tanggal penjualan terakhir** (`julianday('now') - julianday(last_sale_date)`), dihitung langsung di SQL (lihat `getMaintenanceStats` di `src/repositories/analytics.ts`).
- **Ambang batas (threshold):**
  | Status | Definisi | Arti bisnis |
  |--------|----------|-------------|
  | 🟢 **Healthy** | terakhir terjual ≤ 30 hari | produk masih aktif terjual |
  | 🟡 **Warning** | terakhir terjual 31–90 hari | mulai melambat, perlu perhatian |
  | 🔴 **Critical** | terakhir terjual > 90 hari | stagnan / kemungkinan perlu di-discontinue |

  Threshold didefinisikan di `src/config/domain.ts` (`MAINTENANCE_THRESHOLDS`) dan bersifat **dinamis terhadap tanggal hari ini** — response juga mengembalikan `healthyThresholdDate` & `warningThresholdDate` agar frontend bisa menampilkan tanggal patokannya.

- **⚠️ Semua produk bernilai `critical` (efek data lama / historis):**
  Dataset sumber (dari Mapid) berisi `last_sale_date` di sekitar **tahun 2014** (mis. `2014-01-28`). Karena status dihitung relatif terhadap *tanggal hari ini* (2026), selisihnya **> 4.000 hari** sehingga **setiap produk otomatis masuk kategori `critical`**. Ini **bukan bug** — melainkan konsekuensi dataset historis yang dipakai apa adanya. Distribusi maintenance karena itu akan menampilkan 100% critical hingga dataset diganti dengan data yang lebih baru.

- **`recency` vs `last_sale_date`** - Dataset juga punya field `recency` (mis. `135`) yang **tidak dipakai** untuk perhitungan status; backend sengaja memakai `last_sale_date` agar status selalu konsisten dengan tanggal kalender saat ini, bukan angka recency statis yang sudah usang sejak dataset dibuat. Field `recency` tetap disimpan (`recency_days`) untuk keperluan referensi.

### KPI Definitions
Brief meminta KPI: *Total Products, Total Sales, Total Revenue, Average Product Cost*. Pemetaan asumsi ke kolom dataset:

- **Total Products** - `COUNT(*)` baris produk.
- **Total Sales / Total Revenue** - keduanya dipetakan ke `SUM(total_sales)` (kolom `total_sales_idr`). Pada dataset ini **"Sales" dan "Revenue" diperlakukan sebagai nilai yang sama** karena `total_sales` sudah merepresentasikan nilai uang penjualan (quantity × harga). Tidak ada kolom revenue terpisah, sehingga tidak diasumsikan margin/biaya untuk membedakan keduanya.
- **Average Product Cost** - `ROUND(AVG(cost))` (kolom `cost_idr`).

> Catatan: endpoint `GET /api/analytics/kpis` mengembalikan `totalProducts`, `totalQuantity`, `totalSalesIdr`, `avgCostIdr`, sedangkan `GET /api/analytics/dashboard` mengembalikan ringkasan serupa (`totalSales`, `totalOrders`, `avgProductValue`) untuk inisialisasi 1-request.

### Missing Data Policy
Sesuai catatan brief ("jika data hilang/tidak lengkap, gunakan asumsi"), kebijakan saat transform/import (`src/import/transform.ts`):

- **Koordinat hilang/invalid → baris di-skip** dan dicatat di `errors` + `skippedCount` (produk tanpa lokasi tidak dimasukkan, karena lokasi wajib untuk WebGIS).
- **Category / Segment kosong → `'Unknown'`** (dan di-exclude dari chart distribusi via filter `name != 'Unknown'`).
- **Nilai numerik kosong (cost, orders, quantity, sales, customers, dst.) → `0`.**
- **`last_sale_date` kosong → tanggal hari ini** (sehingga produk tanpa tanggal akan tampak `healthy`, bukan `critical`).
- **`recency` kosong → `135`** (nilai default referensi).
- **`location_name` opsional → `NULL`.**

### Dataset Source
- **Sumber data = MAPID GeoServer API** (GeoJSON) yang dikonfigurasi via env `MAPID_DATASET_URL` (+ `MAPID_API_TOKEN` opsional). Untuk reproduktibilitas, sebuah snapshot sample disertakan di `data/seed/sample.json` dan dipakai oleh `npm run seed`.
- **Transformasi diperbolehkan** (sesuai brief): dataset sumber dinormalisasi menjadi skema relasional (tabel `product`, `category`, `segment`, `location`) sebelum disajikan sebagai DTO.

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

## 🔌 17 Endpoints & Fungsi di Frontend

### 1. Health Check (1 endpoint)

#### `GET /health`
**Fungsi Frontend:** Verifikasi backend connectivity  
**Catatan:** Endpoint ini di-mount di root (`/health`), **bukan** di bawah prefix `/api`.  
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

#### `GET /api/analytics/kpis`
**Fungsi Frontend:** Hitung KPI ringkas (total products, total sales, total orders, avg product value) — filter-aware  
**Digunakan untuk:**
- KPI cards yang ikut berubah saat filter diterapkan
- Ringkasan metrik di header dashboard

**Query Parameters:** Same as /api/products (filters supported)

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

> ⚠️ Dengan dataset saat ini (`last_sale_date` ~2014), seluruh produk akan bernilai **critical**. Lihat [Product Health / Maintenance Analysis](#product-health--maintenance-analysis) untuk penjelasan lengkap.

---

### 4. Metadata (4 endpoints)

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
- **CORS** - Middleware manual di `src/app.ts`, origin dikonfigurasi via env `CORS_ORIGIN` (default `http://localhost:5173`)
- **Response compression** - gzip/brotli via `compression`

### ⚠️ Not Implemented (Production TODO)
- Authentication/Authorization
- Rate limiting
- Input sanitization tambahan
- HTTPS enforcement

### Production Setup
```bash
# Setup environment variables
export NODE_ENV=production
export PORT=8080
export CORS_ORIGIN=https://yourdomain.com   # batasi origin di production
```

CORS sudah aktif sebagai middleware manual (lihat `src/app.ts`). Untuk
production, set `CORS_ORIGIN` ke domain frontend. Rate limiting belum ada —
tambahkan mis. `express-rate-limit` jika diperlukan.

---

## 📝 Keterangan Tambahan

### Migration History
```
001_init_spatial.sql                  → Create base tables
002_seed_lookups.sql                  → Seed lookup values
003_create_product.sql                → Create fact table
004_create_import_run.sql             → Create tracking table
005_finalize_schema.sql               → Schema stability
006_add_missing_indexes.sql           → Performance optimization
007_composite_indexes_and_fts5.sql    → Composite indexes + FTS5 full-text search (product_fts)
```

> Pencarian produk (`search`) memakai SQLite **FTS5** (`product_fts`) bila tersedia,
> dengan fallback ke `LIKE` untuk query pendek (< 2 karakter).


### Environment Variables (Optional)
```bash
NODE_ENV=development                       # development | production
PORT=8080                                  # Server port (default kode: 8080; .env lokal di-set 3000)
LOG_LEVEL=info                             # debug | info | warn | error
CORS_ORIGIN=http://localhost:5173          # Origin frontend yang diizinkan
DATABASE_PATH=./data/app.sqlite            # Lokasi file SQLite

# Import dataset eksternal (hanya dipakai saat import, bukan runtime)
MAPID_DATASET_URL=                         # URL GeoJSON dataset
MAPID_API_TOKEN=                           # Bearer token (opsional)
```

> **Catatan port:** Default di kode (`src/config/env.ts`) adalah **8080** dan
> dipakai oleh Docker/production. File `.env` yang ada di repo men-set `PORT=3000`
> untuk development, sehingga contoh `http://localhost:3000` di atas berlaku untuk
> dev lokal.

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

**Docker:**

Project sudah menyertakan `Dockerfile` (two-stage build) + `startup.sh`. Strateginya:
- **Stage 1 (builder):** compile TypeScript, jalankan `migrate` + `seed`, lalu *bake* file SQLite ke dalam image agar container langsung berisi data.
- **Stage 2 (production):** image minimal berisi production deps + compiled JS + DB hasil seed.
- **Ephemeral-filesystem recovery:** `startup.sh` me-migrate & re-seed ulang bila filesystem container terhapus (mis. restart di Railway) sebelum menjalankan server.

```bash
# Build & run
docker build -t product-dashboard-backend .
docker run -p 8080:8080 product-dashboard-backend
# Container expose port 8080 (override via env PORT)
```

> Lihat `Dockerfile` dan `startup.sh` di root folder backend untuk detailnya.

---


**Last Updated:** 2026-06-07

