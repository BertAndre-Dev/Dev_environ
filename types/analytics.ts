/** Shared analytics API types */

export type RevenueTrendGranularity = "week" | "month";

export interface RevenuePoint {
  period: string;
  vendingRevenue: number;
  vendCount: number;
}

export interface AnalyticsPeriodRange {
  startDate: string;
  endDate: string;
}

export interface RevenueTrendData {
  granularity: RevenueTrendGranularity;
  series: RevenuePoint[];
  period: AnalyticsPeriodRange;
}

export interface EstateScope {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  modules: string[];
  visitorVerificationMode?: string;
  companyId?: string | null;
}

export interface AnalyticsScope {
  isAggregate: boolean;
  estateCount: number;
  estates: EstateScope[];
  company: Record<string, unknown> | null;
  period: AnalyticsPeriodRange;
}

export type RevenueTrendScope = AnalyticsScope;

export interface RevenueTrendResponse {
  success: boolean;
  message: string;
  data: RevenueTrendData;
  scope: AnalyticsScope;
}

export interface AveragePurchaseValueData {
  totalVends: number;
  totalAmount: number;
  averagePurchaseValue: number;
  period: AnalyticsPeriodRange;
}

export interface AveragePurchaseValueResponse {
  success: boolean;
  message: string;
  data: AveragePurchaseValueData;
  scope: AnalyticsScope;
}

export interface TopEstateEnergyEntry {
  rank: number;
  estate: EstateScope;
  totalAmount: number;
  vendCount: number;
}

export interface TopEstatesEnergyResponse {
  success: boolean;
  message: string;
  data: TopEstateEnergyEntry[];
  scope: AnalyticsScope;
}
