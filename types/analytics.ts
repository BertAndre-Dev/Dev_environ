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

export interface FaultBreakdownEntry {
  category: string;
  status: string;
  count: number;
}

export interface FaultsSummaryData {
  totalComplaints: number;
  breakdown: FaultBreakdownEntry[];
  note: string;
  period: AnalyticsPeriodRange;
}

export interface FaultsSummaryResponse {
  success: boolean;
  message: string;
  data: FaultsSummaryData;
  scope: AnalyticsScope;
}

export interface MeterCommunicationStatusData {
  totalAssignedMeters: number;
  online: number;
  offline: number;
  unknownStatus: number;
  staleLastSeenCount: number;
  staleThresholdHours: number;
}

export interface MeterCommunicationStatusResponse {
  success: boolean;
  message: string;
  data: MeterCommunicationStatusData;
  scope: AnalyticsScope;
}

export interface PowerAvailabilityData {
  connected: number;
  disconnected: number;
  unknown: number;
  pending_disconnect: number;
  note: string;
}

export interface PowerAvailabilityResponse {
  success: boolean;
  message: string;
  data: PowerAvailabilityData;
  scope: AnalyticsScope;
}

export interface PaymentChannelEntry {
  gateway: string;
  transactionCount: number;
  totalAmount: number;
  paidCount: number;
  failedCount: number;
  successRatePercent: number;
}

export interface PaymentChannelsResponse {
  success: boolean;
  message: string;
  data: PaymentChannelEntry[];
  period: AnalyticsPeriodRange;
  scope: AnalyticsScope;
}

export interface CollectionEfficiencyCategory {
  expected: number;
  collected: number;
  efficiencyPercent: number;
}

export interface CollectionEfficiencyData {
  bills: CollectionEfficiencyCategory;
  rent: CollectionEfficiencyCategory;
  overall: CollectionEfficiencyCategory;
}

export interface CollectionEfficiencyResponse {
  success: boolean;
  message: string;
  data: CollectionEfficiencyData;
  scope: AnalyticsScope;
}

export interface CustomerGrowthMetric {
  current: number;
  previous: number;
  growthRatePercent: number;
}

export interface CustomerGrowthData {
  residents: CustomerGrowthMetric;
  meters: CustomerGrowthMetric;
  comparisonPeriod: AnalyticsPeriodRange;
  period: AnalyticsPeriodRange;
}

export interface CustomerGrowthResponse {
  success: boolean;
  message: string;
  data: CustomerGrowthData;
  scope: AnalyticsScope;
}

export type RechargeBehaviorBucket = "daily" | "weekly" | "monthly";

export interface RechargeBehaviorPoint {
  key: string;
  label: string;
  value: number;
  count: number;
}

export interface RechargeBehaviorData {
  bucket: RechargeBehaviorBucket;
  series: RechargeBehaviorPoint[];
  period: AnalyticsPeriodRange;
}

export interface RechargeBehaviorResponse {
  success: boolean;
  message: string;
  data: RechargeBehaviorData;
  scope: AnalyticsScope;
}

export interface EstateConsumptionEntry {
  estateId: string;
  estateName: string | null;
  metersWithReading: number;
  totalLastReadingConsumption: number;
  averageConsumptionPerMeter: number;
}

export interface ConsumptionSnapshotData {
  estateCount: number;
  metersWithReading: number;
  totalLastReadingConsumption: number;
  averageConsumptionPerMeter: number;
  note: string;
  estates: EstateConsumptionEntry[];
}

export interface ConsumptionSnapshotResponse {
  success: boolean;
  message: string;
  data: ConsumptionSnapshotData;
  scope: AnalyticsScope;
}

export interface CustomerMeterSummaryData {
  totalMeters: number;
  activeMeters: number;
  assignedActiveMeters: number;
  totalResidents: number;
  activeResidents: number;
  period: AnalyticsPeriodRange;
}

export interface CustomerMeterSummaryResponse {
  success: boolean;
  message: string;
  data: CustomerMeterSummaryData;
  scope: AnalyticsScope;
}

export interface CustomerActivationsData {
  newResidents: number;
  newlyAssignedMeters: number;
  totalActivations: number;
  period: AnalyticsPeriodRange;
}

export interface CustomerActivationsResponse {
  success: boolean;
  message: string;
  data: CustomerActivationsData;
  scope: AnalyticsScope;
}

export interface MeterSummaryData {
  totalMeters: number;
  activeMeters: number;
  assignedMeters: number;
  unassignedMeters: number;
}

export interface MeterSummaryResponse {
  success: boolean;
  message: string;
  data: MeterSummaryData;
}

export interface BillsSummaryData {
  totalBills: number;
  activeBills: number;
  suspendedBills: number;
}

export interface BillsSummaryResponse {
  success: boolean;
  message: string;
  data: BillsSummaryData;
}

export interface ComplaintsSummaryData {
  totalComplaints: number;
}

export interface ComplaintsSummaryResponse {
  success: boolean;
  message: string;
  data: ComplaintsSummaryData;
}

export interface ComplaintListItem {
  _id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  createdAt: string;
  daysOpen: number;
}

export interface ComplaintCategoryBreakdownEntry {
  category: string;
  count: number;
}

export interface ComplaintAverageResolutionTime {
  averageResolutionDays: number;
  minResolutionDays: number;
  maxResolutionDays: number;
  resolvedCount: number;
}

export interface ComplaintResolutionRate {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  resolutionRate: number;
}

export interface ComplaintsDashboardData {
  summary: { totalComplaints: number };
  statusBreakdown: Record<string, number>;
  categoryBreakdown: ComplaintCategoryBreakdownEntry[];
  complaintsByResident: unknown[];
  creationTrend: unknown[];
  pendingComplaints: ComplaintListItem[];
  averageResolutionTime: ComplaintAverageResolutionTime;
  oldestUnresolvedComplaints: ComplaintListItem[];
  resolutionRate: ComplaintResolutionRate;
}

export interface ComplaintsDashboardResponse {
  success: boolean;
  message: string;
  data: ComplaintsDashboardData;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  creditTransactions: number;
  debitTransactions: number;
  paidTransactions: number;
}

export interface TransactionSummaryResponse {
  success: boolean;
  message: string;
  data: TransactionSummary;
}

export interface StatusBreakdown {
  paid: number;
  pending: number;
  failed: number;
}

export interface TopUser {
  walletId: string;
  userName: string;
  totalAmount: number;
  transactionCount: number;
  creditAmount: number;
  debitAmount: number;
}

export interface TrendPoint {
  period: string;
  transactionCount: number;
  totalAmount: number;
  creditCount: number;
  debitCount: number;
}

export interface TransactionMetrics {
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
}

export interface RecentCharge {
  _id: string;
  walletId: string;
  type: "debit" | "credit";
  amount: number;
  tx_ref: string;
  serviceCharge: number;
  description: string;
  createdAt: string;
  chargeType: string;
}

export interface ChargeBreakdownItem {
  totalAmount: number;
  chargeType: string;
  transactionCount: number;
}

export interface ChargeAnalyticsSummary {
  totalCharges: number;
  totalTransactions: number;
  averageCharge: number;
  maxCharge: number;
  minCharge: number;
  breakdown: ChargeBreakdownItem[];
}

export interface ChargeAnalytics {
  recentCharges: RecentCharge[];
  summary: ChargeAnalyticsSummary;
}

export interface TransactionAnalyticsDashboard {
  summary: TransactionSummary;
  statusBreakdown: StatusBreakdown;
  topUsers: TopUser[];
  trend: TrendPoint[];
  metrics: TransactionMetrics;
  chargeAnalytics: ChargeAnalytics;
}

export interface TransactionAnalyticsResponse {
  success: boolean;
  message: string;
  data: TransactionAnalyticsDashboard;
}

export interface PlatformFeeAccount {
  bankCode: string;
  accountNumber: string;
}

export interface PlatformFeePeriod {
  startDate: string;
  endDate: string;
}

export interface PlatformFeeFilter {
  estateId: string | null;
  companyId: string | null;
}

export interface PlatformFeeSourceStat {
  total: number;
  count: number;
}

export interface PlatformFeeCards {
  total: number;
  count: number;
  bills: PlatformFeeSourceStat;
  vends: PlatformFeeSourceStat;
  transfers: PlatformFeeSourceStat;
  funding: PlatformFeeSourceStat;
  rents: PlatformFeeSourceStat;
  other: PlatformFeeSourceStat;
  [source: string]: number | PlatformFeeSourceStat;
}

export interface PlatformFeePieSlice {
  label: string;
  value: number;
}

export interface PlatformFeeBarSeries {
  name: string;
  data: number[];
}

export interface PlatformFeeBarChart {
  granularity: "month" | "week" | "day";
  categories: string[];
  series: PlatformFeeBarSeries[];
}

export interface PlatformFeeListItem {
  id: string;
  date: string;
  source: string;
  fee: number;
  description: string;
}

export interface PlatformFeeAnalytics {
  account: PlatformFeeAccount;
  period: PlatformFeePeriod;
  filter: PlatformFeeFilter;
  cards: PlatformFeeCards;
  pieChart: PlatformFeePieSlice[];
  barChart: PlatformFeeBarChart;
  list: PlatformFeeListItem[];
}

export interface PlatformFeePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PlatformFeeResponse {
  success: boolean;
  message: string;
  data: PlatformFeeAnalytics;
  pagination: PlatformFeePagination;
}

export interface PlatformFeeQueryParams {
  startDate: string;
  endDate: string;
  estateId?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}
