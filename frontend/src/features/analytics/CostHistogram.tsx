import { memo, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CostBinDTO } from "../../lib/api/types";
import { formatUSD, formatNumber } from "../../lib/format";
import { useTheme } from "../../lib/theme";
import { ChartCard } from "./ChartCard";
import { CustomTooltip } from "./CustomTooltip";
import { ACCENT, chartTheme } from "./colors";

interface CostHistogramProps {
  data: CostBinDTO[];
  loading?: boolean;
}

/** Auto-binned cost distribution (AC-012), filter-aware via /analytics/cost. */
export const CostHistogram = memo(function CostHistogram({ data, loading }: CostHistogramProps) {
  const { theme } = useTheme();
  const ct = chartTheme(theme);
  const { total, bars } = useMemo(() => {
    const total = data.reduce((s, b) => s + b.count, 0);
    const bars = data.map((b) => ({
      label: `$${formatUSD(b.min)}–$${formatUSD(b.max)}`,
      count: b.count,
      percentage: b.percentage,
    }));
    return { total, bars };
  }, [data]);

  return (
    <ChartCard
      title="Cost Distribution"
      subtitle={
        total > 0
          ? `${formatNumber(total)} products across ${data.length} auto-derived ranges`
          : undefined
      }
      loading={loading}
      isEmpty={bars.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: ct.axis }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={48}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: ct.cursor }} />
          <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
