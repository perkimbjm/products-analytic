// staleTime/gcTime are intentionally NOT set per-hook: they inherit the global
// QueryClient defaults (CACHE_CONFIG in router.tsx — 5 min stale, 10 min gc).
// The data is import-snapshot data that only changes on re-import, so a single
// configured staleTime keeps navigation/panel toggles from triggering refetches.
import { useQuery } from "@tanstack/react-query";
import {
  fetchCategoryStats,
  fetchCostHistogram,
  fetchDashboard,
  fetchFilters,
  fetchKpis,
  fetchMaintenance,
  fetchMapPoints,
  fetchProduct,
  fetchProducts,
  fetchSegmentStats,
  fetchTopProducts,
} from "./client";
import type { AnalyticsParams, ProductsParams } from "./types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
  });
}

export function useMapPoints(
  params: Pick<ProductsParams, "categories" | "segments" | "search"> = {},
) {
  return useQuery({
    queryKey: ["map-points", params],
    queryFn: () => fetchMapPoints(params),
  });
}

export function useFilters() {
  return useQuery({
    queryKey: ["filters"],
    queryFn: fetchFilters,
  });
}

export function useKpis(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["kpis", params],
    queryFn: () => fetchKpis(params),
  });
}

export function useCategoryStats(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["category-stats", params],
    queryFn: () => fetchCategoryStats(params),
  });
}

export function useSegmentStats(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["segment-stats", params],
    queryFn: () => fetchSegmentStats(params),
  });
}

export function useCostHistogram(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["cost-histogram", params],
    queryFn: () => fetchCostHistogram(params),
  });
}

export function useMaintenance(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["maintenance", params],
    queryFn: () => fetchMaintenance(params),
  });
}

export function useTopProducts(limit = 10, params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ["top-products", limit, params],
    queryFn: () => fetchTopProducts(limit, params),
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: id !== null,
  });
}
