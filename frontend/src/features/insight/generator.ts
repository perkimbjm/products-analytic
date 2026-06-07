/**
 * Executive Summary Generator — deterministic business-rule engine.
 *
 * Health Score:  max(0, min(100, 100 - (recencyDays × 0.5)))
 * Health Status: Healthy ≤30d | Warning 31-90d | Critical >90d
 * Maintenance:   Low ≤30d | Medium 31-90d | High >90d
 */

import type { InsightInput, ProductInsight, HealthStatus, MaintenancePriority } from "./types";

// ── Thresholds ──────────────────────────────────────────────────────────────

const HEALTHY_THRESHOLD = 30;
const WARNING_THRESHOLD = 90;

// ── Score ───────────────────────────────────────────────────────────────────

function computeHealthScore(recencyDays: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - recencyDays * 0.5)));
}

// ── Status ──────────────────────────────────────────────────────────────────

function computeHealthStatus(recencyDays: number): HealthStatus {
  if (recencyDays <= HEALTHY_THRESHOLD) return "healthy";
  if (recencyDays <= WARNING_THRESHOLD) return "warning";
  return "critical";
}

// ── Priority ────────────────────────────────────────────────────────────────

function computeMaintenancePriority(recencyDays: number): MaintenancePriority {
  if (recencyDays <= HEALTHY_THRESHOLD) return "low";
  if (recencyDays <= WARNING_THRESHOLD) return "medium";
  return "high";
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function formatUSD(val: number): string {
  return Math.round(val).toLocaleString("en-US");
}

function statusLabel(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    healthy: "🟢 Healthy",
    warning: "🟡 Warning",
    critical: "🔴 Critical",
  };
  return map[status];
}

function priorityLabel(p: MaintenancePriority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

// ── Summary builder ─────────────────────────────────────────────────────────

function buildSummary(p: InsightInput, status: HealthStatus, recencyDays: number): string {
  const parts: string[] = [];

  // 1. Introduction
  const sub = p.subCategory ? ` (${p.subCategory})` : "";
  parts.push(
    `${p.name} is a ${p.category}${sub} product in the ${p.segment} segment.`,
  );

  // 2. Performance
  parts.push(
    `This product generated $${formatUSD(p.totalSales)} in total sales from ${p.totalOrders} transactions. Average monthly revenue reached $${formatUSD(p.avgMonthlyRevenue)}.`,
  );

  // 3. Health
  parts.push(`The last sale activity occurred ${recencyDays} day${recencyDays !== 1 ? "s" : ""} ago.`);

  // 4. Status-specific section
  if (status === "healthy") {
    parts.push(
      "This product shows active and stable performance. Sales activity is running well and does not require special intervention.",
    );
  } else if (status === "warning") {
    parts.push(
      "This product is still generating sales but shows signs of declining activity. Monitoring is needed to ensure the trend does not continue to deteriorate.",
    );
  } else {
    parts.push(
      `This product has good historical performance but has shown no sales activity for ${recencyDays} days. It is recommended as a priority for evaluation regarding re-promotion, pricing strategy, stock optimization, and market demand analysis.`,
    );
  }

  return parts.join("\n\n");
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate a complete executive summary for a product.
 * Pure function, no side effects, no external calls.
 */
export function generateExecutiveSummary(product: InsightInput): ProductInsight {
  const healthScore = computeHealthScore(product.recencyDays);
  const healthStatus = computeHealthStatus(product.recencyDays);
  const maintenancePriority = computeMaintenancePriority(product.recencyDays);
  const summary = buildSummary(product, healthStatus, product.recencyDays);

  return {
    healthScore,
    healthStatus,
    maintenancePriority,
    summary,
  };
}

/** Compute recency days from an ISO date string. */
export function recencyFromDate(dateStr: string): number {
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return 0;
  const now = new Date();
  then.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - then.getTime()) / 86_400_000);
}

export { statusLabel, priorityLabel };
