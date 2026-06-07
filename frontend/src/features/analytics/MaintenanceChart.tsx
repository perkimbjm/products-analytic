import { memo, useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { MaintenanceStatsDTO } from "../../lib/api/types";
import { ChartCard } from "./ChartCard";
import { CustomTooltip } from "./CustomTooltip";
import { MAINTENANCE_COLORS } from "./colors";

interface MaintenanceChartProps {
  data?: MaintenanceStatsDTO;
  loading?: boolean;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * Maintenance health by last-sale recency (AC-013): Healthy ≤30d / Warning 31-90d
 * / Critical >90d, with an interpretation derived from the displayed counts.
 *
 * Thresholds are computed dynamically from each product's recencyDate (ISO date).
 */
export const MaintenanceChart = memo(function MaintenanceChart({
  data,
  loading,
}: MaintenanceChartProps) {
  const { slices, interpretation, total } = useMemo(() => {
    const healthy = data?.healthy ?? 0;
    const warning = data?.warning ?? 0;
    const critical = data?.critical ?? 0;
    const total = healthy + warning + critical;

    // Compute threshold dates for display.
    const now = new Date();
    const healthyDate = new Date(now);
    healthyDate.setDate(healthyDate.getDate() - 30);
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() - 90);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const slices = [
      { name: `Healthy (≥${fmt(healthyDate)})`, value: healthy, color: MAINTENANCE_COLORS.healthy },
      {
        name: `Warning (${fmt(healthyDate)} – ${fmt(warningDate)})`,
        value: warning,
        color: MAINTENANCE_COLORS.warning,
      },
      { name: `Critical`, value: critical, color: MAINTENANCE_COLORS.critical },
    ].filter((s) => s.value > 0);

    const interpretation =
      total === 0
        ? "No products match the active filter."
        : `${pct(healthy, total)}% healthy, ${pct(warning, total)}% warning, and ${pct(critical, total)}% critical (${critical} of ${total} products need a refresh).`;

    return { slices, interpretation, total };
  }, [data]);

  return (
    <ChartCard
      title="Maintenance Health"
      subtitle={interpretation}
      loading={loading}
      isEmpty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {slices.map((s) => (
              <Cell key={s.name} fill={s.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
