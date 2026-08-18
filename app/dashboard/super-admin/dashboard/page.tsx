"use client";

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building2, Gauge, Users } from "lucide-react";
import { DashboardHeader, KpiCard } from "./components";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { RechargeBehaviorChart } from "@/components/charts/RechargeBehaviorChart";
import { ConsumptionSnapshotChart } from "@/components/charts/ConsumptionSnapshotChart";
import {
  TopEstatesEnergyChart,
  formatTopEstatesPeriodLabel,
} from "@/components/charts/TopEstatesEnergyChart";
import { FaultsSummaryChart } from "@/components/charts/FaultsSummaryChart";
import { MeterCommunicationStatusChart } from "@/components/charts/MeterCommunicationStatusChart";
import { PowerAvailabilityCard } from "@/components/charts/PowerAvailabilityCard";
// import { PaymentChannelsChart } from "@/components/charts/PaymentChannelsChart";
import { CollectionEfficiencyChart } from "@/components/charts/CollectionEfficiencyChart";
import { PlatformFeeAnalyticsDashboard } from "@/components/analytics/PlatformFeeAnalyticsDashboard";
import { AveragePurchaseStatCard } from "@/components/dashboard/super-admin/AveragePurchaseStatCard";
import { CustomerMeterSummaryCard } from "@/components/charts/CustomerMeterSummaryCard";
import { CustomerActivationsCard } from "@/components/charts/CustomerActivationsCard";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getRevenueTrend } from "@/redux/slice/super-admin/revenue-trend/revenue-trend";
import {
  selectRevenueTrendError,
  selectRevenueTrendGranularity,
  selectRevenueTrendLoading,
  selectRevenueTrendSeries,
  selectRevenueTrendStatus,
  setRevenueTrendGranularity,
} from "@/redux/slice/super-admin/revenue-trend/revenue-trend-slice";
import { getAveragePurchaseValue } from "@/redux/slice/super-admin/average-purchase/average-purchase";
import {
  selectAveragePurchaseData,
  selectAveragePurchaseError,
  selectAveragePurchaseLoading,
  selectAveragePurchaseStatus,
} from "@/redux/slice/super-admin/average-purchase/average-purchase-slice";
import { getTopEstatesEnergy } from "@/redux/slice/super-admin/top-estates-energy/top-estates-energy";
import {
  selectTopEstatesEnergyError,
  selectTopEstatesEnergyLoading,
  selectTopEstatesEnergyScope,
  selectTopEstatesEnergySeries,
  selectTopEstatesEnergyStatus,
} from "@/redux/slice/super-admin/top-estates-energy/top-estates-energy-slice";
import { getFaultsSummary } from "@/redux/slice/super-admin/faults-summary/faults-summary";
import {
  selectFaultsSummaryData,
  selectFaultsSummaryError,
  selectFaultsSummaryLoading,
  selectFaultsSummaryStatus,
} from "@/redux/slice/super-admin/faults-summary/faults-summary-slice";
import { getMeterCommunicationStatus } from "@/redux/slice/super-admin/meter-communication-status/meter-communication-status";
import {
  selectMeterCommunicationStatusData,
  selectMeterCommunicationStatusError,
  selectMeterCommunicationStatusLoading,
  selectMeterCommunicationStatusStatus,
} from "@/redux/slice/super-admin/meter-communication-status/meter-communication-status-slice";
import { getPowerAvailability } from "@/redux/slice/super-admin/power-availability/power-availability";
import {
  selectPowerAvailabilityData,
  selectPowerAvailabilityError,
  selectPowerAvailabilityLoading,
  selectPowerAvailabilityStatus,
} from "@/redux/slice/super-admin/power-availability/power-availability-slice";
import { getPaymentChannels } from "@/redux/slice/super-admin/payment-channels/payment-channels";
import {
  // selectPaymentChannelsError,
  selectPaymentChannelsLoading,
  // selectPaymentChannelsPeriod,
  selectPaymentChannelsSeries,
  selectPaymentChannelsStatus,
} from "@/redux/slice/super-admin/payment-channels/payment-channels-slice";
import { getCollectionEfficiency } from "@/redux/slice/super-admin/collection-efficiency/collection-efficiency";
import {
  selectCollectionEfficiencyData,
  selectCollectionEfficiencyError,
  selectCollectionEfficiencyLoading,
  selectCollectionEfficiencyStatus,
} from "@/redux/slice/super-admin/collection-efficiency/collection-efficiency-slice";
import { getCustomerGrowth } from "@/redux/slice/super-admin/customer-growth/customer-growth";
import {
  selectCustomerGrowthData,
  selectCustomerGrowthLoading,
  selectCustomerGrowthStatus,
} from "@/redux/slice/super-admin/customer-growth/customer-growth-slice";
import { getRechargeBehavior } from "@/redux/slice/super-admin/recharge-behavior/recharge-behavior";
import {
  selectRechargeBehaviorBucket,
  selectRechargeBehaviorError,
  selectRechargeBehaviorLoading,
  selectRechargeBehaviorSeries,
  selectRechargeBehaviorStatus,
  setRechargeBehaviorBucket,
} from "@/redux/slice/super-admin/recharge-behavior/recharge-behavior-slice";
import { getConsumptionSnapshot } from "@/redux/slice/super-admin/consumption-snapshot/consumption-snapshot";
import {
  selectConsumptionSnapshotData,
  selectConsumptionSnapshotError,
  selectConsumptionSnapshotLoading,
  selectConsumptionSnapshotScope,
  selectConsumptionSnapshotStatus,
} from "@/redux/slice/super-admin/consumption-snapshot/consumption-snapshot-slice";
import {
  getCustomerMeterSummary,
  filterToSummaryArgs,
  type CustomerMeterSummaryFilter,
} from "@/redux/slice/super-admin/customer-meter-summary/customer-meter-summary";
import {
  selectCustomerMeterSummaryData,
  selectCustomerMeterSummaryError,
  selectCustomerMeterSummaryFilter,
  selectCustomerMeterSummaryLoading,
  selectCustomerMeterSummaryScope,
  selectCustomerMeterSummaryStatus,
  setFilter,
} from "@/redux/slice/super-admin/customer-meter-summary/customer-meter-summary-slice";
import { getCompanies } from "@/redux/slice/super-admin/company-mgt/company";
import { getCustomerActivations } from "@/redux/slice/super-admin/customer-activations/customer-activations";
import {
  selectCustomerActivationsData,
  selectCustomerActivationsError,
  selectCustomerActivationsLoading,
  selectCustomerActivationsStatus,
} from "@/redux/slice/super-admin/customer-activations/customer-activations-slice";
import type { RootState, AppDispatch } from "@/redux/store";
import type {
  CustomerGrowthMetric,
  RechargeBehaviorBucket,
  RevenueTrendGranularity,
} from "@/types/analytics";
import Loader from "@/components/ui/Loader";
import { isPending } from "@/lib/async-status";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/api-error";

function formatGrowthCount(metric: CustomerGrowthMetric | null): string {
  if (!metric) return "—";
  return Number(metric.current ?? 0).toLocaleString();
}

function growthTrendProps(metric: CustomerGrowthMetric | null): {
  trend?: string;
  trendUp?: boolean;
} {
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
  const revenueStatus = useSelector(selectRevenueTrendStatus);
  const revenueError = useSelector(selectRevenueTrendError);
  const averagePurchase = useSelector(selectAveragePurchaseData);
  const averagePurchaseLoading = useSelector(selectAveragePurchaseLoading);
  const averagePurchaseStatus = useSelector(selectAveragePurchaseStatus);
  const averagePurchaseError = useSelector(selectAveragePurchaseError);
  const topEstatesSeries = useSelector(selectTopEstatesEnergySeries);
  const topEstatesLoading = useSelector(selectTopEstatesEnergyLoading);
  const topEstatesStatus = useSelector(selectTopEstatesEnergyStatus);
  const topEstatesError = useSelector(selectTopEstatesEnergyError);
  const topEstatesScope = useSelector(selectTopEstatesEnergyScope);
  const faultsSummary = useSelector(selectFaultsSummaryData);
  const faultsSummaryLoading = useSelector(selectFaultsSummaryLoading);
  const faultsSummaryStatus = useSelector(selectFaultsSummaryStatus);
  const faultsSummaryError = useSelector(selectFaultsSummaryError);
  const meterCommStatus = useSelector(selectMeterCommunicationStatusData);
  const meterCommStatusLoading = useSelector(
    selectMeterCommunicationStatusLoading,
  );
  const meterCommAsyncStatus = useSelector(
    selectMeterCommunicationStatusStatus,
  );
  const meterCommStatusError = useSelector(selectMeterCommunicationStatusError);
  const powerAvailability = useSelector(selectPowerAvailabilityData);
  const powerAvailabilityLoading = useSelector(selectPowerAvailabilityLoading);
  const powerAvailabilityStatus = useSelector(selectPowerAvailabilityStatus);
  const powerAvailabilityError = useSelector(selectPowerAvailabilityError);
  const paymentChannelsSeries = useSelector(selectPaymentChannelsSeries);
  const paymentChannelsLoading = useSelector(selectPaymentChannelsLoading);
  const paymentChannelsStatus = useSelector(selectPaymentChannelsStatus);
  // const paymentChannelsError = useSelector(selectPaymentChannelsError);
  // const paymentChannelsPeriod = useSelector(selectPaymentChannelsPeriod);
  const collectionEfficiency = useSelector(selectCollectionEfficiencyData);
  const collectionEfficiencyLoading = useSelector(
    selectCollectionEfficiencyLoading,
  );
  const collectionEfficiencyStatus = useSelector(
    selectCollectionEfficiencyStatus,
  );
  const collectionEfficiencyError = useSelector(
    selectCollectionEfficiencyError,
  );
  const customerGrowth = useSelector(selectCustomerGrowthData);
  const customerGrowthLoading = useSelector(selectCustomerGrowthLoading);
  const customerGrowthStatus = useSelector(selectCustomerGrowthStatus);
  const rechargeSeries = useSelector(selectRechargeBehaviorSeries);
  const rechargeBucket = useSelector(selectRechargeBehaviorBucket);
  const rechargeLoading = useSelector(selectRechargeBehaviorLoading);
  const rechargeStatus = useSelector(selectRechargeBehaviorStatus);
  const rechargeError = useSelector(selectRechargeBehaviorError);
  const consumptionSnapshot = useSelector(selectConsumptionSnapshotData);
  const consumptionSnapshotScope = useSelector(selectConsumptionSnapshotScope);
  const consumptionSnapshotLoading = useSelector(
    selectConsumptionSnapshotLoading,
  );
  const consumptionSnapshotStatus = useSelector(
    selectConsumptionSnapshotStatus,
  );
  const consumptionSnapshotError = useSelector(selectConsumptionSnapshotError);
  const customerMeterSummary = useSelector(selectCustomerMeterSummaryData);
  const customerMeterSummaryScope = useSelector(
    selectCustomerMeterSummaryScope,
  );
  const customerMeterSummaryLoading = useSelector(
    selectCustomerMeterSummaryLoading,
  );
  const customerMeterSummaryStatus = useSelector(
    selectCustomerMeterSummaryStatus,
  );
  const customerMeterSummaryError = useSelector(
    selectCustomerMeterSummaryError,
  );
  const customerMeterSummaryFilter = useSelector(
    selectCustomerMeterSummaryFilter,
  );
  const customerActivations = useSelector(selectCustomerActivationsData);
  const customerActivationsLoading = useSelector(
    selectCustomerActivationsLoading,
  );
  const customerActivationsStatus = useSelector(
    selectCustomerActivationsStatus,
  );
  const customerActivationsError = useSelector(selectCustomerActivationsError);
  const estates = estateState?.allEstates?.data ?? [];
  const estatesPagination = estateState?.allEstates?.pagination ?? null;
  const estatesStatus = estateState?.getAllEstatesState as string | undefined;

  const companies = useSelector(
    (state: RootState) => state.superAdminCompany.list ?? [],
  );
  const companiesStatus = useSelector(
    (state: RootState) => state.superAdminCompany.getListStatus as string,
  );

  const customerMeterEstateOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    for (const e of estates as Array<{
      id?: string;
      _id?: string;
      name?: string;
    }>) {
      const value = String(e?.id ?? e?._id ?? "").trim();
      if (!value) continue;
      options.push({
        label: e.name?.trim() || value,
        value,
      });
    }
    return options;
  }, [estates]);

  const customerMeterCompanyOptions = useMemo(
    () =>
      companies
        .map((c) => {
          const value = String(c?.id ?? c?._id ?? "").trim();
          if (!value) return null;
          return {
            label: c?.name?.trim() || "Unnamed company",
            value,
          };
        })
        .filter((opt): opt is { label: string; value: string } => opt !== null),
    [companies],
  );

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: 200 })).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
  }, [dispatch]);

  useEffect(() => {
    dispatch(getCompanies({ page: 1, limit: 200 })).catch((err: unknown) => {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    });
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
    void dispatch(getCustomerActivations());
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

  useEffect(() => {
    void dispatch(getRechargeBehavior({ bucket: rechargeBucket }));
  }, [dispatch, rechargeBucket]);

  useEffect(() => {
    void dispatch(getConsumptionSnapshot());
  }, [dispatch]);

  useEffect(() => {
    // Default to first estate once the list loads (estate mode is default).
    if (customerMeterSummaryFilter.mode !== "estate") return;
    if (customerMeterSummaryFilter.estateId) return;
    const firstEstateId = customerMeterEstateOptions[0]?.value;
    if (!firstEstateId) return;
    dispatch(setFilter({ mode: "estate", estateId: firstEstateId }));
  }, [dispatch, customerMeterSummaryFilter, customerMeterEstateOptions]);

  useEffect(() => {
    const args = filterToSummaryArgs(customerMeterSummaryFilter);
    if (!args) return;
    void dispatch(getCustomerMeterSummary(args));
  }, [dispatch, customerMeterSummaryFilter]);

  const handleRevenueGranularity = (next: RevenueTrendGranularity) => {
    if (next === revenueGranularity) return;
    dispatch(setRevenueTrendGranularity(next));
  };

  const handleRevenueRetry = () => {
    void dispatch(getRevenueTrend({ granularity: revenueGranularity }));
  };

  const handleRechargeBucket = (next: RechargeBehaviorBucket) => {
    if (next === rechargeBucket) return;
    dispatch(setRechargeBehaviorBucket(next));
  };

  const handleRechargeRetry = () => {
    void dispatch(getRechargeBehavior({ bucket: rechargeBucket }));
  };

  const handleConsumptionSnapshotRetry = () => {
    void dispatch(getConsumptionSnapshot());
  };

  const handleCustomerMeterSummaryFilterChange = (
    next: CustomerMeterSummaryFilter,
  ) => {
    const current = customerMeterSummaryFilter;
    if (current.mode === "estate" && next.mode === "estate") {
      if (current.estateId === next.estateId) return;
    } else if (current.mode === "company" && next.mode === "company") {
      if (current.companyId === next.companyId) return;
    }
    dispatch(setFilter(next));
  };

  const handleCustomerMeterSummaryRetry = () => {
    const args = filterToSummaryArgs(customerMeterSummaryFilter);
    if (!args) return;
    void dispatch(getCustomerMeterSummary(args));
  };

  const handleCustomerActivationsRetry = () => {
    void dispatch(getCustomerActivations());
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

  // const handlePaymentChannelsRetry = () => {
  //   void dispatch(getPaymentChannels());
  // };

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
    (isPending(estatesStatus) && estates.length === 0) ||
    (isPending(companiesStatus) && companies.length === 0) ||
    (isPending(averagePurchaseStatus) && !averagePurchase) ||
    (isPending(powerAvailabilityStatus) && !powerAvailability) ||
    (isPending(revenueStatus) && revenueSeries.length === 0) ||
    (isPending(topEstatesStatus) && topEstatesSeries.length === 0) ||
    (isPending(paymentChannelsStatus) && paymentChannelsSeries.length === 0) ||
    (isPending(collectionEfficiencyStatus) && !collectionEfficiency) ||
    (isPending(faultsSummaryStatus) && !faultsSummary) ||
    (isPending(meterCommAsyncStatus) && !meterCommStatus) ||
    (isPending(customerGrowthStatus) && !customerGrowth) ||
    (isPending(rechargeStatus) && rechargeSeries.length === 0) ||
    (isPending(consumptionSnapshotStatus) && !consumptionSnapshot) ||
    (isPending(customerMeterSummaryStatus) && !customerMeterSummary) ||
    (isPending(customerActivationsStatus) && !customerActivations);

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 ">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        <PlatformFeeAnalyticsDashboard
          estateOptions={customerMeterEstateOptions}
          companyOptions={customerMeterCompanyOptions}
          estatesLoading={
            isPending(estatesStatus) && customerMeterEstateOptions.length === 0
          }
          companiesLoading={
            isPending(companiesStatus) && customerMeterCompanyOptions.length === 0
          }
        />

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

          <CustomerActivationsCard
            data={customerActivations}
            loading={customerActivationsLoading}
            error={customerActivationsError}
            onRetry={handleCustomerActivationsRetry}
          />

          <CustomerMeterSummaryCard
            data={customerMeterSummary}
            scope={customerMeterSummaryScope}
            loading={customerMeterSummaryLoading}
            error={customerMeterSummaryError}
            onRetry={handleCustomerMeterSummaryRetry}
            filter={customerMeterSummaryFilter}
            onFilterChange={handleCustomerMeterSummaryFilterChange}
            estateOptions={customerMeterEstateOptions}
            companyOptions={customerMeterCompanyOptions}
          />


        <RevenueTrendChart
          series={revenueSeries}
          granularity={revenueGranularity}
          loading={revenueLoading}
          error={revenueError}
          onGranularityChange={handleRevenueGranularity}
          onRetry={handleRevenueRetry}
        />

        <RechargeBehaviorChart
          series={rechargeSeries}
          bucket={rechargeBucket}
          loading={rechargeLoading}
          error={rechargeError}
          onBucketChange={handleRechargeBucket}
          onRetry={handleRechargeRetry}
        />

        <TopEstatesEnergyChart
          series={topEstatesSeries}
          loading={topEstatesLoading}
          error={topEstatesError}
          periodLabel={topEstatesPeriodLabel}
          estateCount={topEstatesScope?.estateCount ?? null}
          onRetry={handleTopEstatesRetry}
        />

        <ConsumptionSnapshotChart
          data={consumptionSnapshot}
          scope={consumptionSnapshotScope}
          loading={consumptionSnapshotLoading}
          error={consumptionSnapshotError}
          onRetry={handleConsumptionSnapshotRetry}
        />

        {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <PaymentChannelsChart
            series={paymentChannelsSeries}
            loading={paymentChannelsLoading}
            error={paymentChannelsError}
            period={paymentChannelsPeriod}
            onRetry={handlePaymentChannelsRetry}
          /> */}

          <CollectionEfficiencyChart
            data={collectionEfficiency}
            loading={collectionEfficiencyLoading}
            error={collectionEfficiencyError}
            onRetry={handleCollectionEfficiencyRetry}
          />
        {/* </div> */}

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
