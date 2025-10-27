export interface RawDataRow {
  campaignId: string;
  trafficSource: string;
  nmId: string;
  productName: string;
  date: string; // ISO string format
  shows: number;
  clicks: number;
  ctr: number;
  spend: number;
  added_to_cart: number; // Renamed from addToCart for consistency
  orderedItems: number;
  revenue: number;
}

export type Status = 'good' | 'warn' | 'bad' | 'neutral' | 'info';

export interface Metric {
  value: number | null;
  status: Status;
  tooltip: string;
  displayValue: string;
}

// Represents the full set of metrics for a given period or day
export interface SkuMetricsSet {
  // Raw Aggregated data used for calculations
  spend: number;
  impressions: number;
  clicks: number;
  orderedItems: number;
  revenue: number;
  added_to_cart: number;

  // Calculated Metric Objects for display
  metrics: {
    impressions: Metric;
    clicks: Metric;
    ctr: Metric;
    cpc: Metric;
    cpm: Metric;
    cart_rate: Metric;
    orderedItems: Metric;
    cr: Metric;
    spend: Metric;
    revenue: Metric;
    avg_check: Metric;
    cpa: Metric;
    roas: Metric;
    drr: Metric;
  }
}

// Represents the analysis for a single day
export interface DailyData extends SkuMetricsSet {
  date: string;
}

// The new main data structure for a single SKU
export interface SkuAnalysisResult {
  nmId: string;
  productName: string;
  productImageUrl: string | null;
  
  banner: {
    status: Status;
    shortText: string;
    tooltip: string;
  };

  periodTotals: SkuMetricsSet;
  daily: DailyData[];
}


export interface Filters {
  campaignId: string;
  nmId: string;
  appType: string;
  dateFrom: string;
  dateTo: string;
  compare: boolean; // Keep for now, might be removed if not used
}

export interface AnalyticsConfig {
  margin_pct: number;
  min_clicks_for_cr: number;
}

// Old types - can be removed later if not used elsewhere
export interface KpiData {
  spend: number;
  revenue: number;
  shows: number;
  clicks: number;
  ctr: number;
  cpc: number;
  addToCart: number;
  orderedItems: number;
  cr: number;
  cpa: number;
  avgCheck: number;
  roas: number;
  acos: number;
}