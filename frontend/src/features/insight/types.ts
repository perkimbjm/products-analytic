/** Product Insight types — deterministic business-rule engine. */

export type HealthStatus = "healthy" | "warning" | "critical";

export type MaintenancePriority = "low" | "medium" | "high";

/** Input data required to generate an insight. */
export interface InsightInput {
  name: string;
  category: string;
  subCategory?: string;
  segment: string;
  totalSales: number;
  totalOrders: number;
  avgMonthlyRevenue: number;
  recencyDays: number;
}

/** Generated executive summary output. */
export interface ProductInsight {
  healthScore: number;
  healthStatus: HealthStatus;
  maintenancePriority: MaintenancePriority;
  summary: string;
}
