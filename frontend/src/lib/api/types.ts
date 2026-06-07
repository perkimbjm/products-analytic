// Types yang sesuai dengan backend DTOs

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    count: number;
    limit: number;
    offset: number;
  };
}

export interface ProductMetrics {
  cost: number;
  orders: number;
  quantity: number;
  sales: number;
  customers: number;
  avgSellingPrice: number;
  avgOrderRevenue: number;
  avgMonthlyRevenue: number;
}

export interface LocationDTO {
  latitude: number;
  longitude: number;
}

export interface ProductDTO {
  id: number;
  productKey: number;
  name: string;
  category: string;
  segment: string;
  subCategory?: string;
  location: LocationDTO;
  metrics: ProductMetrics;
  lastSaleDate: string;
  recencyDate: string;
}

export interface MapPointDTO {
  id: number;
  name: string;
  category: string;
  segment: string;
  subCategory?: string;
  latitude: number;
  longitude: number;
  sales: number;
  orders: number;
  avgSellingPrice: number;
  avgMonthlyRevenue: number;
  lastSaleDate: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  sales: number;
}

export interface SegmentBreakdown {
  segment: string;
  count: number;
  sales: number;
}

export interface TopProductDTO {
  id: number;
  name: string;
  sales: number;
}

export interface KPIsDTO {
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  avgProductValue: number;
}

export interface DashboardDTO {
  kpis: KPIsDTO;
  categoryBreakdown: CategoryBreakdown[];
  segmentBreakdown: SegmentBreakdown[];
  topProducts: TopProductDTO[];
}

export interface FilterOption {
  id: number;
  name: string;
}

export interface FiltersDTO {
  categories: FilterOption[];
  segments: FilterOption[];
}

/** Filter-aware KPIs from GET /api/analytics/kpis. */
export interface KpiStatsDTO {
  totalProducts: number;
  totalQuantity: number;
  totalSalesUsd: number;
  avgCostUsd: number;
}

/** GET /api/analytics/category — note: snake_case `sales_Usd`, unlike dashboard. */
export interface CategoryStatDTO {
  category: string;
  count: number;
  sales_Usd: number;
}

export interface SegmentStatDTO {
  segment: string;
  count: number;
  sales_Usd: number;
}

/** GET /api/analytics/cost — auto-binned cost histogram. */
export interface CostBinDTO {
  min: number;
  max: number;
  count: number;
  percentage: number;
}

/** GET /api/analytics/maintenance — recency buckets. */
export interface MaintenanceStatsDTO {
  healthy: number;
  warning: number;
  critical: number;
  /** ISO date threshold for healthy (≥ this date). */
  healthyThresholdDate?: string;
  /** ISO date threshold for warning range. */
  warningThresholdDate?: string;
}

export type SortDir = "asc" | "desc";
export type SortField = "name" | "category" | "segment" | "sales" | "quantity" | "customers" | "margin";

export interface ProductsParams {
  limit?: number;
  offset?: number;
  search?: string;
  categories?: string[];
  segments?: string[];
  minCost?: number;
  maxCost?: number;
  /** `<field>:<dir>`, e.g. `cost:desc`. */
  sort?: string;
}

/** Subset of the global filter that the analytics endpoints accept. */
export interface AnalyticsParams {
  categories?: string[];
  segments?: string[];
  search?: string;
}
