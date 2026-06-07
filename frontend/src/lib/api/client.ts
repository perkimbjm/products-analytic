import type {
  AnalyticsParams,
  ApiResponse,
  CategoryStatDTO,
  CostBinDTO,
  DashboardDTO,
  FiltersDTO,
  KpiStatsDTO,
  MaintenanceStatsDTO,
  MapPointDTO,
  ProductDTO,
  ProductsParams,
  SegmentStatDTO,
  TopProductDTO,
} from "./types";

// API base URL — resolved from VITE_API_BASE_URL at BUILD time (import.meta.env).
//
// - Development: the var is unset, so API_ROOT is "" and requests hit "/api/*",
//   which the Vite dev proxy (vite.config.ts) forwards to the local backend.
// - Production: set VITE_API_BASE_URL to the Railway backend ROOT — no trailing
//   "/api" and no trailing slash; "/api" is appended here. The value is baked
//   into the bundle when `vite build` runs, so it must be present at build time
//   (via frontend/.env.production locally, or a Cloudflare build env var in CI).
const API_ROOT = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const BASE = `${API_ROOT}/api`;

/**
 * Error thrown by the API layer. `offline` is true when the backend could not be
 * reached at all (network failure) or returned a 5xx — i.e. the server is down or
 * broken, as opposed to a normal 4xx. Consumed by the offline fallback UI.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly offline: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    // Request with cache hints: allow stale responses while revalidating in background.
    // Modern browsers support this via stale-while-revalidate; others just use normal caching.
    res = await fetch(`${BASE}${path}`, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // fetch rejects on network-level failures (server down, DNS, CORS preflight).
    throw new ApiError("Cannot reach the server.", true);
  }
  if (!res.ok) {
    throw new ApiError(`API error: ${res.status} ${path}`, res.status >= 500, res.status);
  }
  return res.json();
}

function buildQuery(params: Record<string, string | number | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === "") continue;
    if (Array.isArray(val) && val.length > 0) q.set(key, val.join(","));
    else if (!Array.isArray(val)) q.set(key, String(val));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchDashboard(): Promise<ApiResponse<DashboardDTO>> {
  return get("/analytics/dashboard");
}

export async function fetchProducts(
  params: ProductsParams = {},
): Promise<ApiResponse<ProductDTO[]>> {
  const query = buildQuery({
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    search: params.search,
    categories: params.categories,
    segments: params.segments,
    minCost: params.minCost,
    maxCost: params.maxCost,
    sort: params.sort,
  });
  return get(`/products${query}`);
}

export async function fetchKpis(params: AnalyticsParams = {}): Promise<ApiResponse<KpiStatsDTO>> {
  return get(`/analytics/kpis${buildQuery({ ...params })}`);
}

export async function fetchCategoryStats(
  params: AnalyticsParams = {},
): Promise<ApiResponse<CategoryStatDTO[]>> {
  return get(`/analytics/category${buildQuery({ ...params })}`);
}

export async function fetchSegmentStats(
  params: AnalyticsParams = {},
): Promise<ApiResponse<SegmentStatDTO[]>> {
  return get(`/analytics/segment${buildQuery({ ...params })}`);
}

export async function fetchCostHistogram(
  params: AnalyticsParams = {},
): Promise<ApiResponse<CostBinDTO[]>> {
  return get(`/analytics/cost${buildQuery({ ...params })}`);
}

export async function fetchMaintenance(
  params: AnalyticsParams = {},
): Promise<ApiResponse<MaintenanceStatsDTO>> {
  return get(`/analytics/maintenance${buildQuery({ ...params })}`);
}

export async function fetchProduct(id: number): Promise<ApiResponse<ProductDTO>> {
  return get(`/products/${id}`);
}

export async function fetchMapPoints(
  params: Pick<ProductsParams, "categories" | "segments" | "search"> = {},
): Promise<ApiResponse<MapPointDTO[]>> {
  const query = buildQuery({
    categories: params.categories,
    segments: params.segments,
    search: params.search,
  });
  return get(`/analytics/map-points${query}`);
}

export async function fetchFilters(): Promise<ApiResponse<FiltersDTO>> {
  return get("/meta/filters");
}

export async function fetchTopProducts(
  limit = 10,
  params: AnalyticsParams = {},
): Promise<ApiResponse<TopProductDTO[]>> {
  const query = buildQuery({
    limit,
    categories: params.categories,
    segments: params.segments,
    search: params.search,
  });
  return get(`/analytics/top-products${query}`);
}
