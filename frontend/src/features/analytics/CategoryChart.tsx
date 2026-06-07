import { memo, useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryStatDTO } from "../../lib/api/types";
import { ChartCard } from "./ChartCard";
import { CustomTooltip } from "./CustomTooltip";
import { categoryColor } from "./colors";

interface CategoryChartProps {
  data: CategoryStatDTO[];
  loading?: boolean;
}

/** Product distribution by category (AC-011), filter-aware via /analytics/category. */
export const CategoryChart = memo(function CategoryChart({ data, loading }: CategoryChartProps) {
  const slices = useMemo(() => data.map((d) => ({ name: d.category, value: d.count })), [data]);

  return (
    <ChartCard title="Products by Category" loading={loading} isEmpty={slices.length === 0}>
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
              <Cell key={s.name} fill={categoryColor(s.name)} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
