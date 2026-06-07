export interface ProductMetrics {
  cost: number;
  orders: number;
  quantity: number;
  sales: number;
  customers: number;
  avgSellingPrice: number;
  avgOrderRevenue: number;
  avgMonthlyRevenue: number;
}

export interface LocationDTO {
  latitude: number;
  longitude: number;
}

export interface ProductDTO {
  id: number;
  productKey: number;
  name: string;
  category: string;
  segment: string;
  subCategory?: string;
  location: LocationDTO;
  metrics: ProductMetrics;
  lastSaleDate: string;
  recencyDate: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProductDTO(product: any): ProductDTO {
  // Compute recency date from last_sale_date (Date type).
  const lastSale = new Date(product.last_sale_date);
  const recencyDate = isNaN(lastSale.getTime())
    ? new Date().toISOString().split('T')[0]
    : lastSale.toISOString().split('T')[0];

  return {
    id: product.id,
    productKey: product.product_key,
    name: product.name,
    category: product.category_name,
    segment: product.segment_name,
    subCategory: product.sub_category || undefined,
    location: {
      latitude: product.location.latitude,
      longitude: product.location.longitude,
    },
    metrics: {
      cost: product.cost_idr,
      orders: product.total_orders,
      quantity: product.total_quantity,
      sales: product.total_sales_idr,
      customers: product.total_customers,
      avgSellingPrice: product.avg_selling_price_idr,
      avgOrderRevenue: Math.round(product.avg_order_revenue_idr),
      avgMonthlyRevenue: Math.round(product.avg_monthly_revenue_idr),
    },
    lastSaleDate: product.last_sale_date,
    recencyDate,
  };
}
