import { z } from 'zod';

// Source dataset schema (from MAPID GeoJSON)
export const sourceProductSchema = z.object({
  product_key: z.number().int(),
  product_name: z.string(),
  category: z.string(),
  sub_category: z.string().optional(),
  product_segment: z.string(),
  cost: z.number().int(),
  total_orders: z.number().int(),
  total_quantity: z.number().int(),
  total_sales: z.number().int(),
  total_customers: z.number().int(),
  avg_selling_price: z.number(), // Allow float, will be coerced to int
  avg_order_revenue: z.number(),
  avg_monthly_revenue: z.number(),
  last_sale_date: z.string(), // ISO-8601
  recency: z.number().int().optional(),
});

export type SourceProduct = z.infer<typeof sourceProductSchema>;

// Normalized internal model
export const normalizedProductSchema = z.object({
  product_key: z.number().int(),
  name: z.string(),
  category: z.string(),
  segment: z.string(),
  sub_category: z.string().optional(),
  cost_idr: z.number().int(),
  total_orders: z.number().int(),
  total_quantity: z.number().int(),
  total_sales_idr: z.number().int(),
  total_customers: z.number().int(),
  avg_selling_price_idr: z.number().int(),
  avg_order_revenue_idr: z.number(),
  avg_monthly_revenue_idr: z.number(),
  last_sale_date: z.string(),
  recency_days: z.number().int(),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string().nullable().optional(),
});

export type NormalizedProduct = z.infer<typeof normalizedProductSchema>;
