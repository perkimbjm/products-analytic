import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SegmentStatDTO } from "../../lib/api/types";
import { useTheme } from "../../lib/theme";
import { ChartCard } from "./ChartCard";
import { CustomTooltip } from "./CustomTooltip";
import { SEGMENT_PALETTE, chartTheme } from "./colors";

interface SegmentChartProps {
  data: SegmentStatDTO[];
  loading?: boolean;
}

/** Product distribution by segment (AC-011), filter-aware via /analytics/segment. */
export const SegmentChart = memo(function SegmentChart({ data, loading }: SegmentChartProps) {
  const { theme } = useTheme();
  const ct = chartTheme(theme);
  const bars = useMemo(() => data.map((d) => ({ name: d.segment, count: d.count })), [data]);

  return (
    <ChartCard title="Products by Segment" loading={loading} isEmpty={bars.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ct.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: ct.axis }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: ct.axis }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: ct.cursor }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {bars.map((b, i) => (
              <Cell key={b.name} fill={SEGMENT_PALETTE[i % SEGMENT_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
