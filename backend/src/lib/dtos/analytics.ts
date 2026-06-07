export interface MapPointDTO {
  id: number;
  name: string;
  category: string;
  segment: string;
  latitude: number;
  longitude: number;
  sales: number;
  orders: number;
}

export interface TopProductDTO {
  id: number;
  name: string;
  sales: number;
}

export interface KPIsDTO {
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  avgProductValue: number;
}

export interface CategoryBreakdownDTO {
  category: string;
  count: number;
  sales: number;
}

export interface SegmentBreakdownDTO {
  segment: string;
  count: number;
  sales: number;
}

export interface DashboardDTO {
  kpis: KPIsDTO;
  categoryBreakdown: CategoryBreakdownDTO[];
  segmentBreakdown: SegmentBreakdownDTO[];
  topProducts: TopProductDTO[];
}
