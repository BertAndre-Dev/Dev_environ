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
