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
| `VITE_API_BASE_URL` | *(kosong)* | URL backend untuk **production**. Saat dev dibiarkan kosong (pakai proxy). |

> Format durasi: `5m` (menit), `1h` (jam), `30d` (hari).

**Catatan production:** saat di-deploy, set `VITE_API_BASE_URL` ke URL backend
(mis. `https://my-backend.up.railway.app`). Nilainya di-*bake* ke dalam bundle
saat build, jadi pastikan sudah benar sebelum `npm run build`.

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

Project ini siap di-deploy ke **Vercel** (lihat `vercel.json`):
- Install command: `npm install`
- Build command: `npm run build`

Jangan lupa set environment variable `VITE_API_BASE_URL` di dashboard Vercel
agar mengarah ke backend production.
