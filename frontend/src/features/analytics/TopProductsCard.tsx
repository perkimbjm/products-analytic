import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { GlobalFilters } from "../../lib/filters";
import type { TopProductDTO } from "../../lib/api/types";
import { formatUSD } from "../../lib/format";
import { Icon } from "../../components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

/** How many products show inline before the rest move into the "See all" modal. */
const TOP_N = 5;

interface TopProductsCardProps {
  items: TopProductDTO[];
  loading?: boolean;
  /** Carried through the "View on Map" link so the active filter survives. */
  filters: GlobalFilters;
}

/**
 * Compact Top Products panel: shows the top {@link TOP_N} inline (rank + name +
 * sales + share bar) instead of a tall scrolling list, with the full ranking
 * behind a "See all" modal. Keeps the dashboard's left column short.
 */
export const TopProductsCard = memo(function TopProductsCard({
  items,
  loading,
  filters,
}: TopProductsCardProps) {
  const { max, top } = useMemo(
    () => ({
      max: items.length ? Math.max(...items.map((i) => i.sales)) : 0,
      top: items.slice(0, TOP_N),
    }),
    [items],
  );

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-headline-sm">Top Products by Sales</h4>
        <Link
          to="/"
          search={filters}
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          <Icon name="map" className="text-[16px]" /> View on Map
        </Link>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center justify-center text-outline">
          <Icon name="sync" className="animate-spin mr-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-outline">No data</div>
      ) : (
        <>
          <ol className="space-y-3">
            {top.map((item, i) => (
              <TopRow key={item.id} rank={i + 1} item={item} max={max} />
            ))}
          </ol>

          {items.length > TOP_N && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-4 self-start flex items-center gap-1 text-label-md text-primary hover:underline">
                  See all {items.length}
                  <Icon name="arrow_forward" className="text-[16px]" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Top Products by Sales</DialogTitle>
                </DialogHeader>
                <ol className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 mt-2">
                  {items.map((item, i) => (
                    <TopRow key={item.id} rank={i + 1} item={item} max={max} />
                  ))}
                </ol>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
});

const TopRow = memo(function TopRow({
  rank,
  item,
  max,
}: {
  rank: number;
  item: TopProductDTO;
  max: number;
}) {
  const width = max ? Math.round((item.sales / max) * 100) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="text-label-md text-outline w-5 flex-shrink-0 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-body-md truncate">{item.name}</span>
          <span className="text-label-md text-outline ml-2 flex-shrink-0">
            $ {formatUSD(item.sales)}
          </span>
        </div>
        <div className="h-2 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${width}%` }} />
        </div>
      </div>
    </li>
  );
});
