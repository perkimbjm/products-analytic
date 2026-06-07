/** Shared chart palette for the analytics page. */

export const CATEGORY_COLORS: Record<string, string> = {
  Bikes: "#2563EB",
  Clothing: "#22C55E",
  Accessories: "#F59E0B",
};

export const CATEGORY_FALLBACK = "#94A3B8";

export function categoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? CATEGORY_FALLBACK;
}

/** Cycled for segments, whose names are data-driven (not a fixed set). */
export const SEGMENT_PALETTE = ["#6366F1", "#0EA5E9", "#F59E0B", "#EC4899", "#14B8A6", "#94A3B8"];

export const MAINTENANCE_COLORS = {
  healthy: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
} as const;

export const ACCENT = "#2563EB";

/** Axis/grid/legend colors for Recharts, which needs concrete values (SVG
 * attributes don't resolve CSS var()). Keyed off the active theme. */
export function chartTheme(theme: "light" | "dark") {
  return theme === "dark"
    ? { grid: "#25304a", axis: "#94a3b8", legend: "#cbd5e1", cursor: "#1e293b" }
    : { grid: "#e2e8f0", axis: "#64748b", legend: "#334155", cursor: "#f1f5f9" };
}
