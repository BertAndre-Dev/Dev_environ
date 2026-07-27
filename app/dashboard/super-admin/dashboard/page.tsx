"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2,
  Users,
  Gauge,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";
import {
  DashboardHeader,
  KpiCard,
  DashboardChartCard,
  VendingTrendChart,
  BillsOverviewChart,
} from "./components";
import TransactionsChart from "@/components/charts/transactions-chart";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import {
  TopEstatesEnergyChart,
  formatTopEstatesPeriodLabel,
} from "@/components/charts/TopEstatesEnergyChart";
import { FaultsSummaryChart } from "@/components/charts/FaultsSummaryChart";
import { MeterCommunicationStatusChart } from "@/components/charts/MeterCommunicationStatusChart";
import { PowerAvailabilityCard } from "@/components/charts/PowerAvailabilityCard";
import { PaymentChannelsChart } from "@/components/charts/PaymentChannelsChart";
import { CollectionEfficiencyChart } from "@/components/charts/CollectionEfficiencyChart";
import { AveragePurchaseStatCard } from "@/components/dashboard/super-admin/AveragePurchaseStatCard";
import { Select } from "@/components/ui/select";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getSuperAdminBillsAnalyticsDashboard } from "@/redux/slice/super-admin/super-admin-bills-analytics/super-admin-bills-analytics";
import { getRevenueTrend } from "@/redux/slice/super-admin/revenue-trend/revenue-trend";
import {
  selectRevenueTrendError,
  selectRevenueTrendGranularity,
  selectRevenueTrendLoading,
  selectRevenueTrendSeries,
  setRevenueTrendGranularity,
} from "@/redux/slice/super-admin/revenue-trend/revenue-trend-slice";
import { getAveragePurchaseValue } from "@/redux/slice/super-admin/average-purchase/average-purchase";
import {
  selectAveragePurchaseData,
  selectAveragePurchaseError,
  selectAveragePurchaseLoading,
} from "@/redux/slice/super-admin/average-purchase/average-purchase-slice";
import { getTopEstatesEnergy } from "@/redux/slice/super-admin/top-estates-energy/top-estates-energy";
import {
  selectTopEstatesEnergyError,
  selectTopEstatesEnergyLoading,
  selectTopEstatesEnergyScope,
  selectTopEstatesEnergySeries,
} from "@/redux/slice/super-admin/top-estates-energy/top-estates-energy-slice";
import { getFaultsSummary } from "@/redux/slice/super-admin/faults-summary/faults-summary";
import {
  selectFaultsSummaryData,
  selectFaultsSummaryError,
  selectFaultsSummaryLoading,
} from "@/redux/slice/super-admin/faults-summary/faults-summary-slice";
import { getMeterCommunicationStatus } from "@/redux/slice/super-admin/meter-communication-status/meter-communication-status";
import {
  selectMeterCommunicationStatusData,
  selectMeterCommunicationStatusError,
  selectMeterCommunicationStatusLoading,
} from "@/redux/slice/super-admin/meter-communication-status/meter-communication-status-slice";
import { getPowerAvailability } from "@/redux/slice/super-admin/power-availability/power-availability";
import {
  selectPowerAvailabilityData,
  selectPowerAvailabilityError,
  selectPowerAvailabilityLoading,
} from "@/redux/slice/super-admin/power-availability/power-availability-slice";
import { getPaymentChannels } from "@/redux/slice/super-admin/payment-channels/payment-channels";
import {
  selectPaymentChannelsError,
  selectPaymentChannelsLoading,
  selectPaymentChannelsPeriod,
  selectPaymentChannelsSeries,
} from "@/redux/slice/super-admin/payment-channels/payment-channels-slice";
import { getCollectionEfficiency } from "@/redux/slice/super-admin/collection-efficiency/collection-efficiency";
import {
  selectCollectionEfficiencyData,
  selectCollectionEfficiencyError,
  selectCollectionEfficiencyLoading,
} from "@/redux/slice/super-admin/collection-efficiency/collection-efficiency-slice";
import type { RootState, AppDispatch } from "@/redux/store";
import type { RevenueTrendGranularity } from "@/types/analytics";
import { toast } from "react-toastify";

const BILLS_CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

// Transactions bar chart data (dummy until transaction analytics for super admin)

export default function SuperAdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedEstateId, setSelectedEstateId] = useState<string>("");

  const estateState = useSelector((state: RootState) => (state as any).estate);
  const billsState = useSelector(
    (state: RootState) => (state as any).superAdminBillsAnalytics,
  );
  const revenueSeries = useSelector(selectRevenueTrendSeries);
  const revenueGranularity = useSelector(selectRevenueTrendGranularity);
  const revenueLoading = useSelector(selectRevenueTrendLoading);
  const revenueError = useSelector(selectRevenueTrendError);
  const averagePurchase = useSelector(selectAveragePurchaseData);
  const averagePurchaseLoading = useSelector(selectAveragePurchaseLoading);
  const averagePurchaseError = useSelector(selectAveragePurchaseError);
  const topEstatesSeries = useSelector(selectTopEstatesEnergySeries);
  const topEstatesLoading = useSelector(selectTopEstatesEnergyLoading);
  const topEstatesError = useSelector(selectTopEstatesEnergyError);
  const topEstatesScope = useSelector(selectTopEstatesEnergyScope);
  const faultsSummary = useSelector(selectFaultsSummaryData);
  const faultsSummaryLoading = useSelector(selectFaultsSummaryLoading);
  const faultsSummaryError = useSelector(selectFaultsSummaryError);
  const meterCommStatus = useSelector(selectMeterCommunicationStatusData);
  const meterCommStatusLoading = useSelector(
    selectMeterCommunicationStatusLoading,
  );
  const meterCommStatusError = useSelector(selectMeterCommunicationStatusError);
  const powerAvailability = useSelector(selectPowerAvailabilityData);
  const powerAvailabilityLoading = useSelector(selectPowerAvailabilityLoading);
  const powerAvailabilityError = useSelector(selectPowerAvailabilityError);
  const paymentChannelsSeries = useSelector(selectPaymentChannelsSeries);
  const paymentChannelsLoading = useSelector(selectPaymentChannelsLoading);
  const paymentChannelsError = useSelector(selectPaymentChannelsError);
  const paymentChannelsPeriod = useSelector(selectPaymentChannelsPeriod);
  const collectionEfficiency = useSelector(selectCollectionEfficiencyData);
  const collectionEfficiencyLoading = useSelector(
    selectCollectionEfficiencyLoading,
  );
  const collectionEfficiencyError = useSelector(
    selectCollectionEfficiencyError,
  );

  const estates = estateState?.allEstates?.data ?? [];
  const estatesPagination = estateState?.allEstates?.pagination ?? null;
  const billsDashboard = billsState?.dashboard ?? null;
  const billsLoading = billsState?.status === "isLoading";

  const estateFilterOptions = useMemo(() => {
    if (!estates.length) return [{ label: "Select estate", value: "" }];
    return [
      { label: "Select estate", value: "" },
      ...estates.map((e: { id: string; name: string }) => ({
        label: e.name,
        value: e.id,
      })),
    ];
  }, [estates]);

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: 200 })).catch((err: any) =>
      toast.error(err?.message ?? "Failed to fetch estates"),
    );
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getRevenueTrend({ granularity: revenueGranularity }));
  }, [dispatch, revenueGranularity]);

  useEffect(() => {
    void dispatch(getAveragePurchaseValue());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getTopEstatesEnergy({ limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getFaultsSummary());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getMeterCommunicationStatus());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getPowerAvailability());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getPaymentChannels());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(getCollectionEfficiency());
  }, [dispatch]);

  const handleRevenueGranularity = (next: RevenueTrendGranularity) => {
    if (next === revenueGranularity) return;
    dispatch(setRevenueTrendGranularity(next));
  };

  const handleRevenueRetry = () => {
    void dispatch(getRevenueTrend({ granularity: revenueGranularity }));
  };

  const handleAveragePurchaseRetry = () => {
    void dispatch(getAveragePurchaseValue());
  };

  const handleTopEstatesRetry = () => {
    void dispatch(getTopEstatesEnergy({ limit: 10 }));
  };

  const handleFaultsSummaryRetry = () => {
    void dispatch(getFaultsSummary());
  };

  const handleMeterCommStatusRetry = () => {
    void dispatch(getMeterCommunicationStatus());
  };

  const handlePowerAvailabilityRetry = () => {
    void dispatch(getPowerAvailability());
  };

  const handlePaymentChannelsRetry = () => {
    void dispatch(getPaymentChannels());
  };

  const handleCollectionEfficiencyRetry = () => {
    void dispatch(getCollectionEfficiency());
  };

  const topEstatesPeriodLabel = formatTopEstatesPeriodLabel(
    topEstatesScope?.period?.startDate,
    topEstatesScope?.period?.endDate,
  );

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getSuperAdminBillsAnalyticsDashboard({ estateId: selectedEstateId }),
    ).catch((err: any) =>
      toast.error(err?.message ?? "Failed to fetch bills analytics"),
    );
  }, [selectedEstateId, dispatch]);

  // When estates load, auto-select first estate
  useEffect(() => {
    if (estates.length > 0 && !selectedEstateId) {
      const first = estates[0] as { id: string };
      if (first?.id) setSelectedEstateId(first.id);
    }
  }, [estates, selectedEstateId]);

  // const billsChartData = useMemo(() => {
  //   const topBills = billsDashboard?.topBillsByCollection ?? [];
  //   if (topBills.length === 0) return [];
  //   return topBills.map(
  //     (
  //       bill: {
  //         name: string;
  //         totalAmountCollected?: number;
  //         totalAssignments?: number;
  //       },
  //       i: number,
  //     ) => ({
  //       name: bill.name,
  //       value: bill.totalAmountCollected ?? bill.totalAssignments ?? 0,
  //       fill: BILLS_CHART_COLORS[i % BILLS_CHART_COLORS.length],
  //     }),
  //   );
  // }, [billsDashboard]);

  const kpiCards = useMemo(() => {
    const totalEstates = estatesPagination?.total ?? 0;
    return [
      {
        label: "Total Estates",
        value: String(totalEstates),
        trend: "this month",
        trendUp: true,
        icon: Building2,
        iconBgClassName: "bg-blue-500/10 text-blue-600",
      },
    ];
  }, [estatesPagination?.total]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 ">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AveragePurchaseStatCard
          data={averagePurchase}
          loading={averagePurchaseLoading}
          error={averagePurchaseError}
          onRetry={handleAveragePurchaseRetry}
        />

        <PowerAvailabilityCard
          data={powerAvailability}
          loading={powerAvailabilityLoading}
          error={powerAvailabilityError}
          onRetry={handlePowerAvailabilityRetry}
        />
      </div>

      <RevenueTrendChart
        series={revenueSeries}
        granularity={revenueGranularity}
        loading={revenueLoading}
        error={revenueError}
        onGranularityChange={handleRevenueGranularity}
        onRetry={handleRevenueRetry}
      />

      <TopEstatesEnergyChart
        series={topEstatesSeries}
        loading={topEstatesLoading}
        error={topEstatesError}
        periodLabel={topEstatesPeriodLabel}
        estateCount={topEstatesScope?.estateCount ?? null}
        onRetry={handleTopEstatesRetry}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <PaymentChannelsChart
          series={paymentChannelsSeries}
          loading={paymentChannelsLoading}
          error={paymentChannelsError}
          period={paymentChannelsPeriod}
          onRetry={handlePaymentChannelsRetry}
        />

        <CollectionEfficiencyChart
          data={collectionEfficiency}
          loading={collectionEfficiencyLoading}
          error={collectionEfficiencyError}
          onRetry={handleCollectionEfficiencyRetry}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <FaultsSummaryChart
          data={faultsSummary}
          loading={faultsSummaryLoading}
          error={faultsSummaryError}
          onRetry={handleFaultsSummaryRetry}
        />

        <MeterCommunicationStatusChart
          data={meterCommStatus}
          loading={meterCommStatusLoading}
          error={meterCommStatusError}
          onRetry={handleMeterCommStatusRetry}
        />
      </div>

      {/* <DashboardChartCard title="Transactions" totalLabel="" totalValue="">
        <TransactionsChart
          title="Transactions"
          subtitle="This month's comparison"
          data={transactionsData}
          estateOptions={estateFilterOptions}
          onExport={handleExport}
        />
      </DashboardChartCard> */}

      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <DashboardChartCard
          title="Bills by collection"
          totalLabel={
            billsDashboard?.paymentStatistics
              ? `Collected: N${Number(billsDashboard.paymentStatistics.totalAmountCollected).toLocaleString()}`
              : undefined
          }
          totalValue={
            billsDashboard?.paymentStatistics
              ? `Expected: N${Number(billsDashboard.paymentStatistics.totalAmountExpected).toLocaleString()}`
              : undefined
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select
                options={estateFilterOptions}
                value={selectedEstateId}
                onChange={(e) => setSelectedEstateId(e.target.value)}
                className="h-9 min-w-[180px] appearance-none pr-8"
              />
              <ChevronDown
                className="h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
            </div>
            {selectedEstateId === "" && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Select an estate to view bills
              </p>
            )}
            {selectedEstateId !== "" && billsLoading && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading bills...
              </p>
            )}
            {selectedEstateId !== "" &&
              !billsLoading &&
              billsChartData.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No bills data for this estate
                </p>
              )}
            {selectedEstateId !== "" &&
              !billsLoading &&
              billsChartData.length > 0 && (
                <BillsOverviewChart data={billsChartData} />
              )}
          </div>
        </DashboardChartCard>
        <DashboardChartCard
          title="Vending"
          totalLabel="Total Transactions"
          totalValue="N150,000,000"
        >
          <VendingTrendChart />
        </DashboardChartCard>
      </div> */}
    </div>
  );
}
