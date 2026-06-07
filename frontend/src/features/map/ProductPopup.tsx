import { useState } from "react";
import { formatUSD } from "../../lib/format";
import { Icon } from "../../components/Icon";
import { ProductInsightPanel } from "../insight/ProductInsightPanel";

export interface SelectedPoint {
  id: number;
  name: string;
  category: string;
  segment: string;
  subCategory?: string;
  sales: number;
  orders: number;
  avgSellingPrice: number;
  avgMonthlyRevenue: number;
  lastSaleDate: string;
  latitude: number;
  longitude: number;
}

type PopupTab = "detail" | "insight";

interface ProductPopupProps {
  selected: SelectedPoint;
  loading: boolean;
  onClose: () => void;
}

/** Detail/Insight tabbed content for a selected map point. */
export function ProductPopup({ selected, loading, onClose }: ProductPopupProps) {
  const [tab, setTab] = useState<PopupTab>("detail");

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--map-text-dim)] uppercase tracking-wider">
            {selected.category}
          </p>
          <h3 className="text-base font-semibold leading-tight mt-0.5 truncate">{selected.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--map-text-dim)] hover:text-[var(--map-text)] flex-shrink-0 ml-2"
          aria-label="Close"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>

      <div className="flex border-b border-[var(--map-border)] mb-4">
        <TabButton
          icon="info"
          label="Detail"
          active={tab === "detail"}
          onClick={() => setTab("detail")}
        />
        <TabButton
          icon="psychology"
          label="Insight"
          active={tab === "insight"}
          onClick={() => setTab("insight")}
        />
      </div>

      {tab === "detail" ? (
        <DetailTab selected={selected} loading={loading} />
      ) : (
        <ProductInsightPanel
          product={{
            name: selected.name,
            category: selected.category,
            subCategory: selected.subCategory,
            segment: selected.segment,
            totalSales: selected.sales,
            totalOrders: selected.orders,
            avgMonthlyRevenue: selected.avgMonthlyRevenue,
            lastSaleDate: selected.lastSaleDate,
          }}
          loading={loading}
        />
      )}
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-[var(--map-text-dim)] hover:text-[var(--map-text)]"
      }`}
    >
      <Icon name={icon} className="text-[16px]" /> {label}
    </button>
  );
}

function DetailTab({ selected, loading }: { selected: SelectedPoint; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCell wide="w-20" h="h-5" />
          <SkeletonCell wide="w-14" h="h-5" />
          <SkeletonCell wide="w-16" h="h-4" />
          <SkeletonCell wide="w-24" h="h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <DetailCell label="Sales" value={`${formatUSD(selected.sales)} USD`} />
      <DetailCell label="Orders" value={selected.orders.toLocaleString()} />
      <DetailCell label="Segment" value={selected.segment} small />
      <DetailCell
        label="Coords"
        value={`${selected.latitude.toFixed(3)}, ${selected.longitude.toFixed(3)}`}
        faint
      />
    </div>
  );
}

function DetailCell({
  label,
  value,
  small,
  faint,
}: {
  label: string;
  value: string;
  small?: boolean;
  faint?: boolean;
}) {
  const valueClass = faint
    ? "text-[11px] text-[var(--map-text-dim)]"
    : small
      ? "text-sm font-semibold"
      : "text-lg font-bold";
  return (
    <div className="bg-[var(--map-sunken)] rounded-lg p-3">
      <p className="text-[10px] text-[var(--map-text-dim)] uppercase">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function SkeletonCell({ wide, h }: { wide: string; h: string }) {
  return (
    <div className="bg-[var(--map-sunken)] rounded-lg p-3">
      <div className="h-2 w-10 bg-[var(--map-border)] rounded mb-2" />
      <div className={`${h} ${wide} bg-[var(--map-border)] rounded`} />
    </div>
  );
}
