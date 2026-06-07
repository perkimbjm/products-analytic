import { Link } from "@tanstack/react-router";
import type { GlobalFilters } from "../../lib/filters";
import { formatUSD } from "../../lib/format";
import { Icon } from "../../components/Icon";

/** Brand hex per category, used by the donut + legend. */
const CATEGORY_COLORS: Record<string, string> = {
  Bikes: "#2563EB",
  Clothing: "#22C55E",
  Accessories: "#F59E0B",
};

const CATEGORY_FALLBACK = "#94A3B8";

interface CategorySlice {
  category: string;
  count: number;
}

interface TopProduct {
  id: number | string;
  name: string;
  sales: number;
}

interface MarketOverviewContentProps {
  stats: { products: string; categories: string; segments: string; onMap: string };
  categories: CategorySlice[];
  totalCount: number;
  topProducts: TopProduct[];
  /** Carried through the "View Dashboard" link so the active filter survives. */
  filters: GlobalFilters;
  /** Tighter spacing for the mobile bottom-sheet variant. */
  compact?: boolean;
}

/**
 * Inner content of the Market Overview panel: stat grid, category donut + legend,
 * top products, and the dashboard link. Shared by the desktop side panel and the
 * mobile bottom sheet, which differ only in spacing (`compact`).
 */
export function MarketOverviewContent({
  stats,
  categories,
  totalCount,
  topProducts,
  filters,
  compact = false,
}: MarketOverviewContentProps) {
  const gap = compact ? "gap-2" : "gap-3";
  const blockMb = compact ? "mb-4" : "mb-5";
  const labelMb = compact ? "mb-2" : "mb-3";
  const sectionMt = compact ? "mt-4" : "mt-5";
  const legendSpace = compact ? "space-y-1.5" : "space-y-2";
  const donutGap = compact ? "gap-3" : "gap-4";
  const linkPad = compact ? "py-2" : "py-2.5";
  const linkIcon = compact ? "text-[16px]" : "text-[18px]";

  return (
    <>
      <div className={`grid grid-cols-2 ${gap} ${blockMb}`}>
        <StatCard
          icon="inventory_2"
          iconColor="text-primary"
          label="Products"
          value={stats.products}
        />
        <StatCard
          icon="category"
          iconColor="text-category-clothing"
          label="Categories"
          value={stats.categories}
        />
        <StatCard
          icon="segment"
          iconColor="text-category-accessories"
          label="Segments"
          value={stats.segments}
        />
        <StatCard icon="location_on" iconColor="text-red-400" label="On Map" value={stats.onMap} />
      </div>

      <div>
        <p className={`text-[11px] uppercase tracking-wider text-[var(--map-text-dim)] ${labelMb}`}>
          Products by Category
        </p>
        <div className={`flex items-center ${donutGap}`}>
          <DonutChart
            segments={categories.map((c) => ({
              label: c.category,
              count: c.count,
              color: CATEGORY_COLORS[c.category] ?? CATEGORY_FALLBACK,
            }))}
            total={totalCount}
          />
          <div className={`flex-1 ${legendSpace} text-sm`}>
            {categories.map((c) => (
              <LegendRow
                key={c.category}
                color={CATEGORY_COLORS[c.category] ?? CATEGORY_FALLBACK}
                label={c.category}
                value={`${Math.round((c.count / totalCount) * 100)}%`}
              />
            ))}
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className={sectionMt}>
          <p
            className={`text-[11px] uppercase tracking-wider text-[var(--map-text-dim)] ${labelMb}`}
          >
            Top Products
          </p>
          <div className={legendSpace}>
            {topProducts.slice(0, 4).map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--map-text-dim)] w-4">{i + 1}</span>
                <span className="flex-1 text-xs text-[var(--map-text-dim)] truncate">{p.name}</span>
                <span className="text-[11px] text-[var(--map-text-dim)] flex-shrink-0">
                  {formatUSD(p.sales)} USD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        to="/analytics"
        search={filters}
        className={`${sectionMt} w-full flex items-center justify-center gap-2 bg-[var(--map-border)] hover:bg-[var(--map-hover)] ${linkPad} rounded-lg text-sm font-medium border border-[var(--map-border)]`}
      >
        <Icon name="bar_chart" className={linkIcon} /> View Dashboard
      </Link>
    </>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[var(--map-sunken)] border border-[var(--map-border)] rounded-xl p-3 hover:border-primary/40 hover:bg-[var(--map-hover)] transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} className={`${iconColor} text-[16px]`} />
        <span className="text-[10px] uppercase tracking-wider text-[var(--map-text-dim)] font-medium">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[var(--map-text-dim)]">{label}</span>
      </div>
      <span className="text-[var(--map-text-dim)] font-medium">{value}</span>
    </div>
  );
}

function DonutChart({
  segments,
  total,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
}) {
  const r = 32;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--map-border)" strokeWidth="10" />
      {segments.map((s, i) => {
        const len = c * (s.count / total);
        const el = (
          <circle
            key={i}
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="10"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
      <text
        x="45"
        y="50"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        transform="rotate(90 45 45)"
      >
        {total}
      </text>
    </svg>
  );
}
