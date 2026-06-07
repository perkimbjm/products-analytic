import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "../../components/Icon";

interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  /** Data is being fetched. */
  loading?: boolean;
  /** Fetch resolved but there is nothing to plot. */
  isEmpty?: boolean;
  /** Fixed plot height in px (Recharts ResponsiveContainer needs a sized parent). */
  height?: number;
  children: ReactNode;
}

/**
 * Card frame for a chart. Centralizes the loading / empty states and gates the
 * chart behind a client-mount flag so Recharts' ResponsiveContainer never runs
 * during SSR (avoids hydration mismatches).
 */
export function ChartCard({
  title,
  subtitle,
  loading,
  isEmpty,
  height = 220,
  children,
}: ChartCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col">
      <div className="mb-4">
        <h4 className="text-headline-sm">{title}</h4>
        {subtitle && <p className="text-label-md text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      <div style={{ height }} className="w-full">
        {!mounted || loading ? (
          <div className="h-full w-full rounded-lg bg-surface-container animate-pulse" />
        ) : isEmpty ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-on-surface-variant">
            <Icon name="bar_chart_off" className="text-[36px] mb-1" />
            <span className="text-body-md">No data for this filter</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
