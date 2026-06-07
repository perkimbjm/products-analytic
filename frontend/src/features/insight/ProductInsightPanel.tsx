import { useEffect, useMemo, useState } from "react";
import type { ProductInsight, HealthStatus, MaintenancePriority } from "./types";
import { Icon } from "../../components/Icon";
import { generateExecutiveSummary, recencyFromDate, statusLabel, priorityLabel } from "./generator";

interface ProductInsightPanelProps {
  product: {
    name: string;
    category: string;
    subCategory?: string;
    segment: string;
    totalSales: number;
    totalOrders: number;
    avgMonthlyRevenue: number;
    lastSaleDate: string;
  };
  loading?: boolean;
  onClose?: () => void;
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-green-500/10 text-green-500 border-green-500/30",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
};

const PRIORITY_COLORS: Record<MaintenancePriority, string> = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-red-500/10 text-red-500",
};

const SCORE_RING_COLORS: Record<HealthStatus, string> = {
  healthy: "#22C55E",
  warning: "#F59E0B",
  critical: "#EF4444",
};

function ScoreRing({ score, status }: { score: number; status: HealthStatus }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = SCORE_RING_COLORS[status];

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--map-border)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold">{score}</span>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 bg-[var(--map-border)] rounded" />
        <div className="h-4 w-24 bg-[var(--map-border)] rounded" />
      </div>
      <div className="h-5 w-48 bg-[var(--map-border)] rounded" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-[var(--map-border)] rounded-full" />
        <div className="h-6 w-28 bg-[var(--map-border)] rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--map-border)]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-20 bg-[var(--map-border)] rounded" />
          <div className="h-6 w-16 bg-[var(--map-border)] rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-[var(--map-border)] rounded" />
        <div className="h-3 w-full bg-[var(--map-border)] rounded" />
        <div className="h-3 w-3/4 bg-[var(--map-border)] rounded" />
        <div className="h-3 w-full bg-[var(--map-border)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--map-border)] rounded" />
      </div>
    </div>
  );
}

export function ProductInsightPanel({ product, loading = false, onClose }: ProductInsightPanelProps) {
  const [insight, setInsight] = useState<ProductInsight | null>(null);

  const recencyDays = useMemo(() => recencyFromDate(product.lastSaleDate), [product.lastSaleDate]);

  // Generate insight with a brief delay for skeleton UX.
  useEffect(() => {
    setInsight(null);
    const timer = setTimeout(() => {
      const result = generateExecutiveSummary({
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        segment: product.segment,
        totalSales: product.totalSales,
        totalOrders: product.totalOrders,
        avgMonthlyRevenue: product.avgMonthlyRevenue,
        recencyDays,
      });
      setInsight(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [product, recencyDays]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="psychology" className="text-[18px] text-primary" />
          <h4 className="text-sm font-semibold">Product Insight</h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[var(--map-text-dim)] hover:text-[var(--map-text)]">
            <Icon name="close" className="text-[18px]" />
          </button>
        )}
      </div>

      {loading || !insight ? (
        <SkeletonPanel />
      ) : (
        <>
          {/* Product identity */}
          <div>
            <h3 className="text-base font-semibold leading-tight">{product.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--map-sunken)] text-[var(--map-text-dim)]">
                {product.category}
              </span>
              {product.subCategory && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--map-sunken)] text-[var(--map-text-dim)]">
                  {product.subCategory}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--map-sunken)] text-[var(--map-text-dim)]">
                {product.segment}
              </span>
            </div>
          </div>

          {/* Health Score + Status */}
          <div className="flex items-center gap-4">
            <ScoreRing score={insight.healthScore} status={insight.healthStatus} />
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-[var(--map-text-dim)]">Health Score</p>
              <p className="text-lg font-bold">{insight.healthScore} / 100</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[insight.healthStatus]}`}>
                {statusLabel(insight.healthStatus)}
              </span>
            </div>
          </div>

          {/* Maintenance Priority */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-[var(--map-text-dim)]">Maintenance Priority</p>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${PRIORITY_COLORS[insight.maintenancePriority]}`}>
              {priorityLabel(insight.maintenancePriority)}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--map-border)]" />

          {/* Executive Summary */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--map-text-dim)] mb-2">Executive Summary</p>
            <div className="text-sm leading-relaxed text-[var(--map-text)] space-y-3 text-justify">
              {insight.summary.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
