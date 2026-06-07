/**
 * Reusable skeleton loaders for data placeholders.
 * Uses animate-pulse from Tailwind for smooth shimmer effect.
 */

interface SkeletonProps {
  /** Width: "full" | "3/4" | "1/2" | or custom Tailwind class */
  width?: string;
  /** Height in Tailwind units: "h-4" | "h-8" | etc */
  height?: string;
  /** Adds rounded corners */
  rounded?: boolean;
  /** Custom className */
  className?: string;
}

export function Skeleton({
  width = "full",
  height = "h-4",
  rounded = true,
  className = "",
}: SkeletonProps) {
  const widthClass = width === "full" ? "w-full" : width.startsWith("w-") ? width : `w-${width}`;
  const roundedClass = rounded ? "rounded" : "";
  return (
    <div
      className={`bg-surface-container-high animate-pulse ${widthClass} ${height} ${roundedClass} ${className}`}
    />
  );
}

/** Skeleton for a table row with specific column shapes */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-outline-variant/60">
      {/* No. */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-8" height="h-4" />
      </td>
      {/* Product Name */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="space-y-2">
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-3" />
        </div>
      </td>
      {/* Category */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-20" height="h-6" rounded={true} />
      </td>
      {/* Segment */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-24" height="h-4" />
      </td>
      {/* Revenue */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-20" height="h-4" />
      </td>
      {/* Units Sold */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-12" height="h-4" />
      </td>
      {/* Customers */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-12" height="h-4" />
      </td>
      {/* Margin % */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-12" height="h-4" />
      </td>
      {/* Health */}
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <Skeleton width="w-16" height="h-6" rounded={true} />
      </td>
    </tr>
  );
}

/** Skeleton for a KPI card */
export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="w-1/3" height="h-4" />
        <Skeleton width="w-8" height="h-8" rounded={true} />
      </div>
      <Skeleton width="w-1/2" height="h-8" />
      <Skeleton width="w-2/3" height="h-3" />
    </div>
  );
}

/** Skeleton for a chart card */
export function ChartCardSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-6 space-y-4">
      <Skeleton width="w-1/3" height="h-5" />
      <div className="h-48 sm:h-64 flex items-center justify-center">
        <Skeleton width="w-3/4" height="h-full" className="rounded" />
      </div>
    </div>
  );
}
