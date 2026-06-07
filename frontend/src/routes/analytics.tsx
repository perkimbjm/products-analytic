import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCategoryStats,
  useCostHistogram,
  useDashboard,
  useFilters,
  useKpis,
  useMaintenance,
  useProducts,
  useSegmentStats,
} from "../lib/api/hooks";
import { filterSearchSchema, useGlobalFilters } from "../lib/filters";
import { formatUSD, formatUSDAccounting } from "../lib/format";
import { Icon } from "../components/Icon";
import { AppHeader } from "../components/AppHeader";
import { FilterSelect } from "../components/FilterSelect";
import { useDebouncedCallback } from "../hooks/use-debounced-callback";
import type { ProductDTO, SortField } from "../lib/api/types";
import { recencyFromDate } from "../features/insight/generator";
import type { HealthStatus } from "../features/insight/types";
import { CategoryChart } from "../features/analytics/CategoryChart";
import { TopProductsCard } from "../features/analytics/TopProductsCard";
import { SegmentChart } from "../features/analytics/SegmentChart";
import { CostHistogram } from "../features/analytics/CostHistogram";
import { MaintenanceChart } from "../features/analytics/MaintenanceChart";
import { ProductDetailSheet } from "../features/insight/ProductDetailSheet";
import { TableRowSkeleton, KpiCardSkeleton } from "../components/Skeleton";

export const Route = createFileRoute("/analytics")({
  component: Dashboard,
  validateSearch: filterSearchSchema,
});

const CATEGORY_COLORS: Record<string, string> = {
  Bikes: "bg-category-bikes/10 text-category-bikes",
  Clothing: "bg-category-clothing/10 text-category-clothing",
  Accessories: "bg-category-accessories/10 text-category-accessories",
};

const CATEGORY_ICON: Record<string, string> = {
  Bikes: "directions_bike",
  Clothing: "checkroom",
  Accessories: "sports_motorsports",
};

/** Pill styling for a filter <select> chip; highlighted when a value is active. */
function chipClass(active: boolean): string {
  const base =
    "rounded-full px-3 py-1.5 text-label-md cursor-pointer outline-none border transition-colors";
  return active
    ? `${base} bg-primary/10 text-primary border-primary/30`
    : `${base} bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-variant`;
}

function Dashboard() {
  const { filters, setFilters, resetFilters } = useGlobalFilters();
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [page, setPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const LIMIT = 20;

  const hasActiveFilters = Boolean(filters.category || filters.segment || filters.q);

  function clearFilters() {
    resetFilters();
    setSearchInput("");
    toast.success("Filters cleared", { description: "All filters have been removed." });
  }

  const [sort, setSort] = useState<{ field: SortField; dir: "asc" | "desc" } | null>(null);

  // Analytics endpoints share the global category/segment filter (AC-011..013).
  const analyticsParams = useMemo(
    () => ({
      categories: filters.category ? [filters.category] : undefined,
      segments: filters.segment ? [filters.segment] : undefined,
    }),
    [filters.category, filters.segment],
  );

  const { data: dashboardRes, isLoading: dashboardLoading } = useDashboard();
  const { data: filtersRes } = useFilters();
  const { data: kpisRes, isLoading: kpisLoading } = useKpis(analyticsParams);
  const { data: categoryRes, isLoading: categoryLoading } = useCategoryStats(analyticsParams);
  const { data: segmentRes, isLoading: segmentLoading } = useSegmentStats(analyticsParams);
  const { data: costRes, isLoading: costLoading } = useCostHistogram(analyticsParams);
  const { data: maintenanceRes, isLoading: maintenanceLoading } = useMaintenance(analyticsParams);
  const { data: productsRes, isLoading: prodLoading } = useProducts({
    limit: LIMIT,
    offset: page * LIMIT,
    search: filters.q || undefined,
    categories: filters.category ? [filters.category] : undefined,
    segments: filters.segment ? [filters.segment] : undefined,
    sort: sort ? `${sort.field}:${sort.dir}` : undefined,
  });

  // Any change to the global filter or sort resets pagination to the first page.
  useEffect(() => {
    setPage(0);
  }, [filters.q, filters.category, filters.segment, sort]);

  const dashboard = dashboardRes?.data;
  const kpis = kpisRes?.data;
  const filterOptions = filtersRes?.data;
  const products = productsRes?.data ?? [];
  const totalProducts = productsRes?.meta?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / LIMIT);

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev?.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" },
    );
  }

  // Debounce writing the query into the shared URL state.
  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => setFilters({ q: value || undefined }),
    400,
  );

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSetQuery(value);
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <AppHeader
        title="Product Analysis Dashboard"
        active="dashboard"
        filters={filters}
        position="fixed"
      />

      <main className="pt-[84px] pb-12 px-4 lg:px-margin-desktop">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-headline-lg text-on-surface">Dashboard</h1>
            <p className="text-body-md text-on-surface-variant">
              Overview of product discovery and market performance
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <Icon name="paid" className="text-[14px]" /> Currency: USD ($)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-tertiary/10 text-tertiary border border-tertiary/20">
                <Icon name="calendar_month" className="text-[14px]" /> Analysis Period: 12–13 Months
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {kpisLoading && (
              <span className="text-label-md text-outline flex items-center gap-1">
                <Icon name="sync" className="text-[18px] animate-spin" /> Loading data...
              </span>
            )}
            <Link
              to="/"
              search={filters}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-label-md shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Icon name="map" className="text-[18px]" /> Map View
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-8">
          {kpisLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                icon="inventory"
                iconColor="text-primary"
                iconBg="bg-primary-container/10"
                label="Total Products"
                value={String(kpis?.totalProducts ?? 0)}
                sub="items"
                barColor="bg-primary"
              />
              <KpiCard
                icon="payments"
                iconColor="text-tertiary"
                iconBg="bg-tertiary/10"
                label="Total Revenue"
                value={`$ ${formatUSD(kpis?.totalSalesIdr ?? 0)}`}
                sub="revenue"
                barColor="bg-tertiary"
              />
              <KpiCard
                icon="shopping_cart"
                iconColor="text-category-clothing"
                iconBg="bg-category-clothing/10"
                label="Total Sales Quantity"
                value={formatUSD(kpis?.totalQuantity ?? 0)}
                sub="units sold"
                barColor="bg-category-clothing"
              />
              <KpiCard
                icon="sell"
                iconColor="text-category-accessories"
                iconBg="bg-category-accessories/10"
                label="Average Product Cost"
                value={`$ ${formatUSD(kpis?.avgCostIdr ?? 0)}`}
                sub="per product"
                barColor="bg-category-accessories"
              />
            </>
          )}
        </div>

        {/* Charts Grid — Top products + category distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-8">
          <TopProductsCard
            items={dashboard?.topProducts ?? []}
            loading={dashboardLoading}
            filters={filters}
          />
          <CategoryChart data={categoryRes?.data ?? []} loading={categoryLoading} />
        </div>

        {/* Analytics Grid — segment, cost histogram, maintenance (AC-011..013) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-8">
          <SegmentChart data={segmentRes?.data ?? []} loading={segmentLoading} />
          <CostHistogram data={costRes?.data ?? []} loading={costLoading} />
          <MaintenanceChart data={maintenanceRes?.data} loading={maintenanceLoading} />
        </div>

        {/* Products Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {/* Toolbar: full-width search (left) + filter chips & clear (right) */}
          <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]"
              />
              <input
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-md outline-none focus:border-primary"
                placeholder="Search products..."
                value={searchInput}
                onChange={handleSearch}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                className={chipClass(Boolean(filters.category))}
                value={filters.category ?? ""}
                onChange={(category) => setFilters({ category })}
                options={filterOptions?.categories ?? []}
                allLabel="All Categories"
              />
              <FilterSelect
                className={chipClass(Boolean(filters.segment))}
                value={filters.segment ?? ""}
                onChange={(segment) => setFilters({ segment })}
                options={filterOptions?.segments ?? []}
                allLabel="All Segments"
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-label-md text-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon name="close" className="text-[16px]" /> Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-label-md font-bold text-outline uppercase">
                    No.
                  </th>
                  <SortableTh label="Product Name" field="name" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Category" field="category" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Segment" field="segment" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Revenue" field="sales" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Units Sold" field="quantity" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Customers" field="customers" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Margin %" field="margin" sort={sort} onSort={toggleSort} />
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-label-md font-bold text-outline uppercase">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {prodLoading
                  ? Array.from({ length: LIMIT }).map((_, i) => <TableRowSkeleton key={i} />)
                  : products.map((p: ProductDTO, i: number) => (
                      <ProductRow
                        key={p.id}
                        p={p}
                        n={page * LIMIT + i + 1}
                        onSelect={setSelectedProduct}
                      />
                    ))}
                {!prodLoading && products.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-outline text-body-md">
                      <Icon name="search_off" className="text-[40px] block mx-auto mb-2" />
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 sm:p-6 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-3 bg-surface-container-low">
            {prodLoading ? (
              <span className="h-5 w-44 rounded bg-surface-container animate-pulse" />
            ) : (
              <p className="text-body-md text-outline text-center sm:text-left">
                <span className="hidden sm:inline">
                  Showing {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalProducts)} of{" "}
                  {totalProducts} results
                </span>
                <span className="sm:hidden">
                  {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, totalProducts)} of{" "}
                  {totalProducts}
                </span>
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant border border-outline-variant disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={pageNum}
                    className={`w-8 h-8 flex items-center justify-center rounded text-label-md ${
                      pageNum === page
                        ? "bg-primary text-white font-bold"
                        : "hover:bg-surface-variant"
                    }`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-variant border border-outline-variant disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        <ProductDetailSheet
          product={selectedProduct}
          open={selectedProduct !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedProduct(null);
          }}
        />
      </main>
    </div>
  );
}

const ProductRow = memo(function ProductRow({
  p,
  n,
  onSelect,
}: {
  p: ProductDTO;
  n: number;
  onSelect: (p: ProductDTO) => void;
}) {
  const recencyDays = useMemo(() => recencyFromDate(p.recencyDate), [p.recencyDate]);
  const healthStatus = useMemo<HealthStatus>(
    () => (recencyDays <= 30 ? "healthy" : recencyDays <= 90 ? "warning" : "critical"),
    [recencyDays],
  );
  const margin = useMemo(
    () =>
      p.metrics.avgSellingPrice > 0
        ? Math.round(
            ((p.metrics.avgSellingPrice - p.metrics.cost) / p.metrics.avgSellingPrice) * 100,
          )
        : 0,
    [p.metrics.avgSellingPrice, p.metrics.cost],
  );

  function handleSelect() {
    onSelect(p);
    toast.info(`Viewing ${p.name}`, { duration: 2000 });
  }

  return (
    <tr
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${p.name}`}
      className="cursor-pointer hover:bg-surface-container-lowest hover:shadow-sm focus:bg-surface-container-lowest focus:outline-none transition-all duration-200 group"
    >
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-body-md text-outline">{n}</td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
            <Icon
              name={CATEGORY_ICON[p.category] ?? "inventory"}
              className={`text-[20px] ${
                p.category === "Bikes"
                  ? "text-category-bikes"
                  : p.category === "Clothing"
                    ? "text-category-clothing"
                    : "text-category-accessories"
              }`}
            />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-body-md block truncate">{p.name}</span>
            {p.subCategory && (
              <span className="text-label-md text-outline truncate block">{p.subCategory}</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <span
          className={`px-2.5 py-1 rounded-full text-label-md font-bold ${CATEGORY_COLORS[p.category] ?? "bg-surface-container text-outline"}`}
        >
          {p.category}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <span className="text-label-md font-medium px-2 py-1 bg-surface-container rounded">
          {p.segment}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-body-md font-semibold">
        {formatUSDAccounting(p.metrics.sales)}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-body-md">
        {p.metrics.quantity.toLocaleString()}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-body-md">
        {p.metrics.customers.toLocaleString()}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-body-md">
        <span
          className={`font-semibold ${margin >= 30 ? "text-secondary" : margin >= 10 ? "text-tertiary" : "text-danger"}`}
        >
          {margin}%
        </span>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            healthStatus === "healthy"
              ? "bg-green-500/10 text-green-500"
              : healthStatus === "warning"
                ? "bg-amber-500/10 text-amber-500"
                : "bg-red-500/10 text-red-500"
          }`}
        >
          {healthStatus === "healthy" ? "🟢" : healthStatus === "warning" ? "🟡" : "🔴"}{" "}
          {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
        </span>
        <Icon
          name="chevron_right"
          className="text-[18px] text-outline opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      </td>
    </tr>
  );
});
function SortableTh({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: SortField;
  sort: { field: SortField; dir: "asc" | "desc" } | null;
  onSort: (field: SortField) => void;
}) {
  const active = sort?.field === field;
  return (
    <th className="px-3 sm:px-6 py-3 sm:py-4 text-label-md font-bold text-outline uppercase">
      <button
        type="button"
        onClick={() => onSort(field)}
        aria-label={`Sort by ${label}`}
        className={`group flex items-center gap-1 uppercase transition-colors hover:text-primary ${active ? "text-primary" : ""}`}
      >
        {label}
        {active ? (
          <Icon
            name={sort!.dir === "asc" ? "arrow_upward" : "arrow_downward"}
            className="text-[16px]"
          />
        ) : (
          // Dimmed by default; the active column is the only one that looks "on".
          <Icon name="unfold_more" className="text-[16px] opacity-25 group-hover:opacity-60" />
        )}
      </button>
    </th>
  );
}

function KpiCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  barColor,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  barColor: string;
}) {
  const heights = ["40%", "60%", "55%", "75%", "90%"];
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon name={icon} className={`${iconColor} text-[28px]`} />
        </div>
        <div className="text-right">
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{label}</p>
          <h3 className="text-headline-md font-bold">{value}</h3>
          <p className="text-label-md text-outline">{sub}</p>
        </div>
      </div>
      <div className="h-8 w-full flex items-end px-1 gap-0.5 mt-2">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`${barColor} opacity-30 w-full rounded-t-sm`}
            style={{ height: h }}
          />
        ))}
      </div>
    </div>
  );
}
