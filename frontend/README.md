# Product Analysis Dashboard — Frontend

Antarmuka (UI) untuk **Product Analysis Dashboard**: peta interaktif sebaran
produk (WebGIS) dan halaman analytics berisi KPI, chart, dan tabel produk.

Dibangun dengan **React + TanStack Start**, mengambil data dari Backend API.

---

## 📋 Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | **React 19** + **TanStack Start** (file-based routing + SSR) |
| Bahasa | **TypeScript** (strict) |
| Build tool | **Vite 7** |
| Data fetching | **TanStack Query** (cache + auto refetch) |
| Routing | **TanStack Router** |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (Radix UI, style *new-york*) |
| Peta | **MapLibre GL JS** |
| Chart | **Recharts** |
| Form & validasi | **react-hook-form** + **Zod** |
| Ikon & notif | **lucide-react**, **sonner** (toast) |

---

## 🚀 Cara Menjalankan Project

### Prasyarat
- **Node.js** 20+ (atau **Bun** 1.x)
- **Backend** sudah berjalan (default di `http://localhost:3000`). Lihat `../backend/README.md`.

### 1. Install dependencies
```bash
cd frontend
npm install
# atau: bun install
```

### 2. Siapkan environment (opsional)
```bash
cp .env.example .env
```
Nilai default sudah cukup untuk development. Lihat bagian
[Environment Variables](#-environment-variables) di bawah.

### 3. Jalankan development server
```bash
npm run dev
# atau: bun run dev
```
Aplikasi berjalan di: **http://localhost:5173**

> Saat development, semua request ke `/api/*` otomatis di-*proxy* ke backend di
> `http://localhost:3000` (diatur di `vite.config.ts`), jadi tidak perlu set URL backend.

### 4. Build untuk production
```bash
npm run build      # hasil build siap deploy
npm run preview    # cek hasil build secara lokal
```

### Perintah lain
```bash
npm run lint       # cek kualitas kode (ESLint)
npm run format     # rapikan kode (Prettier)
```

---

## 🗺️ Halaman Aplikasi

### Halaman 1 — Map View (`/`)
Peta interaktif sebaran produk (sesuai brief *Offline Store Distribution / WebGIS*):
- Peta full-width dengan **MapLibre GL JS**
- Menampilkan titik produk dari dataset
- **Marker clustering** otomatis saat jumlah titik > 10
- Filter: **Category**, **Product Segment**, dan **Search nama produk**
- Filter langsung me-refresh data di peta

### Halaman 2 — Analytics Dashboard (`/analytics`)
- **KPI Cards**: Total Products, Total Sales, Total Revenue, Average Product Cost
- **Charts**:
  - Product Category Distribution
  - Product Segment Distribution
  - Cost Distribution (histogram)
  - Maintenance Analysis (status kesehatan produk)
- **Product Table**: pagination, search, dan sorting

---

## ⚙️ Environment Variables

Semua variabel memakai prefix `VITE_` (syarat Vite). Lihat `.env.example`.

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `VITE_CACHE_STALE_TIME` | `5m` | Berapa lama data dianggap "fresh" sebelum refetch di background |
| `VITE_CACHE_GC_TIME` | `10m` | Berapa lama data tak terpakai disimpan di memori |
| `VITE_CACHE_BASEMAP_TTL` | `30d` | TTL cache basemap peta |
| `VITE_API_BASE_URL` | *(kosong)* | **ROOT** URL backend untuk **production** (mis. `https://my-backend.up.railway.app`) — **tanpa** `/api` dan **tanpa** trailing slash; client menambahkan `/api` sendiri. Saat dev dibiarkan kosong (pakai proxy). |

> Format durasi: `5m` (menit), `1h` (jam), `30d` (hari).

**Catatan production (penting):** `VITE_API_BASE_URL` adalah variabel **build-time** —
nilainya di-*bake* ke dalam bundle saat `vite build` (lewat `import.meta.env`), bukan
runtime. Jadi:
- Set ke **root** backend saja, tanpa `/api`. Resolusi-nya ada di `src/lib/api/client.ts`
  (`API_ROOT` + `/api`). Jika kosong saat build, request jatuh ke `/api/*` relatif
  (benar untuk dev, tapi **salah** untuk production karena mengarah ke domain frontend).
- Variabel **harus tersedia ketika build berjalan** — lewat `.env.production` (build lokal)
  atau build variable di CI (lihat [Deployment](#-deployment)).

---

## 📌 Asumsi yang Digunakan

- **Mata uang USD** — Semua nilai uang ditampilkan dalam **US Dollar** (mis. `$ 21.210`),
  mengikuti dataset sumber. Lihat `../backend/README.md` untuk alasannya.
- **Maintenance = semua `critical`** — Status kesehatan produk dihitung dari
  `last_sale_date`. Karena dataset berisi data tahun ~2014, semua produk otomatis
  berstatus **critical**. Ini bukan bug, melainkan efek data historis (detail di backend README).
- **Backend sebagai sumber data** — Frontend tidak memproses/agregasi data berat;
  semua perhitungan (KPI, chart, histogram) dilakukan di backend, frontend hanya menampilkan.
- **State filter di URL** — Filter (category, segment, search) disimpan di query URL,
  sehingga kondisi halaman bisa di-*share* dan tetap sama saat di-refresh.
- **Mode offline** — Jika backend tidak bisa dihubungi, UI menampilkan banner/fallback,
  bukan halaman error kosong.
- **Clustering threshold = 10** — Clustering aktif hanya ketika titik di peta lebih dari 10.

---

## 📂 Struktur Folder

```
src/
├── routes/            # Halaman (file-based routing TanStack)
│   ├── index.tsx      # Halaman 1 — Map View
│   ├── analytics.tsx  # Halaman 2 — Analytics Dashboard
│   └── __root.tsx     # Layout utama aplikasi
├── features/          # Fitur per-domain (reusable)
│   ├── map/           # Komponen & util peta (basemap, popup, kontrol)
│   ├── analytics/     # Chart (category, segment, cost, maintenance)
│   ├── insight/       # Detail & insight produk
│   └── overview/      # Ringkasan pasar
├── components/        # Komponen UI bersama (header, filter, dll.)
│   └── ui/            # Komponen dasar shadcn/ui
├── hooks/             # Custom hooks (mobile, debounce, dll.)
└── lib/
    ├── api/           # API client, hooks (TanStack Query), tipe data
    ├── filters.ts     # Sinkronisasi filter ↔ URL
    └── format.ts      # Formatter angka & USD
```

> `routeTree.gen.ts` dibuat otomatis — jangan diedit manual.

---

## 🚢 Deployment

Project ini di-deploy ke **Cloudflare Workers** (Static Assets + SSR). Konfigurasi
ada di `wrangler.jsonc`:
- `main`: `dist/server/server.js` — Worker SSR (TanStack Start)
- `assets.directory`: `dist/client` — file statis client

### Opsi A — Deploy manual dari lokal
```bash
cd frontend
npm run deploy        # menjalankan: vite build && wrangler deploy
```
Build membaca `frontend/.env.production`, jadi pastikan `VITE_API_BASE_URL` di file
itu sudah benar (root backend, tanpa `/api`). File ini **gitignored**.

### Opsi B — Cloudflare Workers Builds (CI dari repo terhubung)
Karena `.env.production` tidak ikut ter-commit, set `VITE_API_BASE_URL` sebagai
**build variable** — bukan runtime variable:

- Dashboard Cloudflare → Worker Anda → **Settings → Build → Build variables and secrets**
  (⚠️ **bukan** "Variables and Secrets" runtime di bagian atas Settings — yang itu
  tidak terbaca oleh `vite build`).
- Tambah `VITE_API_BASE_URL = https://my-backend.up.railway.app` (root, tanpa `/api`).
- **Trigger build ulang** (Retry build / push commit) — menyimpan variabel saja tidak
  cukup, build harus dijalankan ulang agar nilainya ter-*bake*.

**Verifikasi:** buka Network tab di app production — request harus menuju
`https://<backend>/api/...`, bukan relatif ke domain Worker.
