"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building2, Gauge, Users } from "lucide-react";
import { DashboardHeader, KpiCard } from "./components";
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
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
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
import { getCustomerGrowth } from "@/redux/slice/super-admin/customer-growth/customer-growth";
import {
  selectCustomerGrowthData,
  selectCustomerGrowthLoading,
} from "@/redux/slice/super-admin/customer-growth/customer-growth-slice";
import type { RootState, AppDispatch } from "@/redux/store";
import type {
  CustomerGrowthMetric,
  RevenueTrendGranularity,
} from "@/types/analytics";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";

function formatGrowthCount(metric: CustomerGrowthMetric | null): string {
  if (!metric) return "—";
  return Number(metric.current ?? 0).toLocaleString();
}

function growthTrendProps(
  metric: CustomerGrowthMetric | null,
): { trend?: string; trendUp?: boolean } {
  if (!metric) return {};
  const rate = Number(metric.growthRatePercent ?? 0);
  return {
    trend: `${rate.toFixed(1)}% vs last period`,
    trendUp: rate >= 0,
  };
}

export default function SuperAdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();

  const estateState = useSelector((state: RootState) => (state as any).estate);
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
  const customerGrowth = useSelector(selectCustomerGrowthData);
  const customerGrowthLoading = useSelector(selectCustomerGrowthLoading);

  const estates = estateState?.allEstates?.data ?? [];
  const estatesPagination = estateState?.allEstates?.pagination ?? null;
  const estatesLoading = estateState?.getAllEstatesState === "isLoading";

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

  useEffect(() => {
    void dispatch(getCustomerGrowth());
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

  const kpiCards = useMemo(() => {
    const totalEstates = estatesPagination?.total ?? 0;
    const residents = customerGrowth?.residents ?? null;
    const meters = customerGrowth?.meters ?? null;

    return [
      {
        label: "Total Estates",
        value: String(totalEstates),
        trend: "this month",
        trendUp: true,
        icon: Building2,
        iconBgClassName: "bg-blue-500/10 text-blue-600",
      },
      {
        label: "Total Residents",
        value: formatGrowthCount(residents),
        ...growthTrendProps(residents),
        icon: Users,
        iconBgClassName: "bg-emerald-500/10 text-emerald-600",
      },
      {
        label: "Total Meters",
        value: formatGrowthCount(meters),
        ...growthTrendProps(meters),
        icon: Gauge,
        iconBgClassName: "bg-amber-500/10 text-amber-600",
      },
    ];
  }, [estatesPagination?.total, customerGrowth]);

  const pageLoading =
    (estatesLoading && estates.length === 0) ||
    (averagePurchaseLoading && !averagePurchase) ||
    (powerAvailabilityLoading && !powerAvailability) ||
    (revenueLoading && revenueSeries.length === 0) ||
    (topEstatesLoading && topEstatesSeries.length === 0) ||
    (paymentChannelsLoading && paymentChannelsSeries.length === 0) ||
    (collectionEfficiencyLoading && !collectionEfficiency) ||
    (faultsSummaryLoading && !faultsSummary) ||
    (meterCommStatusLoading && !meterCommStatus) ||
    (customerGrowthLoading && !customerGrowth);

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading dashboard..." />}

      <div
        className={[
          "space-y-6 sm:space-y-8 pb-8",
          pageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
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
      </div>
    </div>
  );
}
