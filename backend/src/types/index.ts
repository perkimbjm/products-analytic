// Domain types

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Segment {
  id: number;
  name: string;
  created_at: string;
}

export interface Location {
  id: number;
  name?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  // geom is a SpatiaLite geometry (not directly serializable to JSON)
}

export interface Product {
  id: number;
  product_key: number;
  name: string;
  category_id: number;
  segment_id: number;
  location_id: number;
  sub_category?: string;
  cost_idr: number;
  total_orders: number;
  total_quantity: number;
  total_sales_idr: number;
  total_customers: number;
  avg_selling_price_idr: number;
  avg_order_revenue_idr: number;
  avg_monthly_revenue_idr: number;
  last_sale_date: string;
  recency_days: number;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

export interface ImportRun {
  id: number;
  source: string;
  source_url?: string;
  started_at: string;
  finished_at?: string;
  status: 'success' | 'partial' | 'failed';
  record_count: number;
  skipped_count: number;
  error?: string;
}

// Source dataset types (from GeoJSON)
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoJSONFeature {
  id: string;
  type: 'Feature';
  geometry: GeoJSONPoint;
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
