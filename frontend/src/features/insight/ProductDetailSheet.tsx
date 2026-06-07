import type { ProductDTO } from "../../lib/api/types";
import { formatUSDAccounting, formatNumber } from "../../lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { ProductInsightPanel } from "./ProductInsightPanel";

interface ProductDetailSheetProps {
  /** The row the user clicked, or null when the sheet is closed. */
  product: ProductDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Side-sheet product detail, opened by clicking a row in the products table.
 * Mirrors the Map's detail popup by reusing {@link ProductInsightPanel}, so both
 * surfaces present the same insight for a product.
 */
export function ProductDetailSheet({ product, open, onOpenChange }: ProductDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {product && (
          <div className="flex flex-col gap-5">
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {product.category}
                {product.subCategory ? ` · ${product.subCategory}` : ""} · {product.segment}
              </p>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Revenue" value={formatUSDAccounting(product.metrics.sales)} />
              <Stat label="Orders" value={formatNumber(product.metrics.orders)} />
              <Stat label="Units Sold" value={formatNumber(product.metrics.quantity)} />
              <Stat label="Customers" value={formatNumber(product.metrics.customers)} />
            </div>

            <ProductInsightPanel
              product={{
                name: product.name,
                category: product.category,
                subCategory: product.subCategory,
                segment: product.segment,
                totalSales: product.metrics.sales,
                totalOrders: product.metrics.orders,
                avgMonthlyRevenue: product.metrics.avgMonthlyRevenue,
                lastSaleDate: product.lastSaleDate,
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <p className="text-[10px] uppercase tracking-wider text-outline">{label}</p>
      <p className="text-body-md font-semibold mt-0.5">{value}</p>
    </div>
  );
}
