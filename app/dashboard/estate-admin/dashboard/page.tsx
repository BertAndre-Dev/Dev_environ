"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { TrendingUp, Users, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import TransactionsChart from "@/components/charts/transactions-chart";
import BillsOverview from "@/components/charts/bills-overview";
import OccupancyDistribution from "@/components/charts/occupancy-distribution";
import { BillsStatusDonutCard } from "@/components/charts/bills-status-donut-card";
import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import MeterStatusPie from "@/components/charts/meter-status-pie";
import MeterTrendChart from "@/components/charts/meter-trend-chart";
import MeterCreditSummary from "@/components/charts/meter-credit-summary";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getEstateAdminEnergyConsumptionChart } from "@/redux/slice/estate-admin/energy-consumption/estate-admin-energy-consumption";
import { getEstateAdminEstateEnergyUsage } from "@/redux/slice/estate-admin/estate-energy-usage/estate-admin-estate-energy-usage";
import { getEstateAdminTransactionSummary } from "@/redux/slice/estate-admin/transaction-summary/estate-admin-transaction-summary";
import { extractEstateIdFromUser, extractEstateNameFromUser } from "@/lib/user-id";
import type { AppDispatch, RootState } from "@/redux/store";

const formatNaira = (n: number) => `${n.toLocaleString()}`;

export default function DummyDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const [transactionChartView, setTransactionChartView] = useState("revenue");
  const [meterChartView, setMeterChartView] = useState("assignment");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Sunshine Estate");
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);

  const { transactionSummary, transactionSummaryLoading } = useSelector(
    (state: RootState) => ({
      transactionSummary: state.estateAdminTransactionSummary.summary,
      transactionSummaryLoading:
        state.estateAdminTransactionSummary.status === "isLoading",
    }),
  );

  const { energyConsumptionChart, energyChartLoading } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.estateAdminEnergyConsumption.chart,
      energyChartLoading:
        state.estateAdminEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.estateAdminEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.estateAdminEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.estateAdminEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.estateAdminEstateEnergyUsage.message,
    estateEnergyUsageError: state.estateAdminEstateEnergyUsage.error,
  }));

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        const id = extractEstateIdFromUser(user);
        const name = extractEstateNameFromUser(user) ?? "Estate";
        if (id) {
          setEstateId(id);
          setEstateName(name);
        }
      } catch (err: unknown) {
        const msg =
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load user.";
        toast.error(msg);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateAdminTransactionSummary({ estateId })).catch(
      (err: unknown) => {
        const msg =
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load transaction summary.";
        toast.error(msg);
      },
    );
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateAdminEstateEnergyUsage({ estateId, range: usageRange })).catch(
      (err: unknown) => {
        const msg =
          err &&
          typeof err === "object" &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load estate energy usage.";
        toast.error(msg);
      },
    );
  }, [dispatch, estateId, usageRange]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getEstateAdminEnergyConsumptionChart({
        estateId,
        period: energyPeriod,
      }),
    ).catch((err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Failed to load energy consumption chart.";
      toast.error(msg);
    });
  }, [dispatch, estateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!estateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getEstateAdminEstateEnergyUsage({
          estateId,
          range: usageRange,
          refresh: true,
        }),
      ).unwrap();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Failed to refresh estate energy usage.";
      toast.error(msg);
    } finally {
      setUsageRefreshing(false);
    }
  };

  /** 🔥 Dummy Stats */
  const stats = [
    {
      title: "Total Revenue",
      value: `12500000`,
      change: "this month",
      trend: "up",
      icon: DollarSign,
      color: "bg-[#D0DFF280] text-[#0150AC]",
    },
    {
      title: "Transactions",
      value: 1240,
      change: "this month",
      trend: "up",
      icon: Users,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Paid Bills",
      value: `8900000`,
      change: "320 active",
      trend: "up",
      icon: FileText,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Pending",
      value: `3600000`,
      change: "120 unpaid",
      trend: "up",
      icon: FileText,
      color: "bg-[#FFF4E5] text-[#FF8A00]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of{" "}
          <span className="font-bold uppercase">{estateName}</span>
        </p>
      </div>

      {/* KPI */}
      {/* <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-4">
              <div className="flex justify-between">
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <Icon size={18} />
                </div>
                <TrendingUp size={16} />
              </div>
              <p className="text-sm mt-2">{stat.title}</p>
              <h2 className="text-2xl font-bold">{stat.value}</h2>
            </Card>
          );
        })}
      </div> */}

      <TransactionSummaryCard
        data={transactionSummary}
        loading={transactionSummaryLoading}
        emptyMessage={
          !estateId
            ? "No estate linked to your account."
            : "No transaction data to display."
        }
      />

      <div className="space-y-6">
        <EstatePowerUsageSection
          data={estateEnergyUsage}
          loading={estateEnergyUsageLoading}
          progress={estateEnergyUsageProgress}
          range={usageRange}
          onRangeChange={setUsageRange}
          onRefresh={handleRefreshUsage}
          refreshing={usageRefreshing}
          emptyMessage={
            estateEnergyUsageError ??
            estateEnergyUsageMessage ??
            undefined
          }
        />
        <EnergyConsumptionOverTimeCard
          data={energyConsumptionChart}
          loading={energyChartLoading}
          period={energyPeriod}
          onPeriodChange={setEnergyPeriod}
          emptyMessage={
            !estateId
              ? "No estate linked to your account."
              : "No vending data for this period yet."
          }
        />
      </div>

      {/* Transactions */}
      {/* <div>
        <Select
          options={[
            { label: "Revenue", value: "revenue" },
            { label: "Type", value: "type" },
            { label: "Charges", value: "charge" },
          ]}
          value={transactionChartView}
          onChange={(e) => setTransactionChartView(e.target.value)}
        />

        {transactionChartView === "revenue" && (
          <TransactionsChart title="Revenue Trend" data={revenueTrendData} />
        )}
        {transactionChartView === "type" && (
          <TransactionsChart title="Transaction Type" data={typeBreakdownData} />
        )}
        {transactionChartView === "charge" && (
          <TransactionsChart title="Charge Breakdown" data={chargeBreakdownData} />
        )}
      </div> */}

      {/* Bills */}
      {/* <Card className="p-4">
        <BillsOverview title="Bills" data={billsOverviewData} />
      </Card> */}

      {/* Bills status + Occupancy */}
      {/* <div className="grid lg:grid-cols-2 gap-6">
        <BillsStatusDonutCard title="Bills" data={billsStatusData} />
        <OccupancyDistribution
          totalResidents={5000}
          occupiedPercentage={65}
          vacantPercentage={35}
        />
      </div> */}

      {/* Meter */}
      {/* <div>
        <Select
          options={[
            { label: "Assignment", value: "assignment" },
            { label: "Active", value: "active" },
            { label: "Trend", value: "trend" },
            { label: "Credit", value: "credit" },
          ]}
          value={meterChartView}
          onChange={(e) => setMeterChartView(e.target.value)}
        />

        {meterChartView === "assignment" && (
          <MeterStatusPie title="Assignment" data={meterAssignmentPieData} />
        )}
        {meterChartView === "active" && (
          <MeterStatusPie title="Active" data={meterActivePieData} />
        )}
        {meterChartView === "trend" && (
          <MeterTrendChart title="Trend" data={meterTrendData} />
        )}
        {meterChartView === "credit" && (
          <MeterCreditSummary
            title="Credit"
            data={{
              averageCredit: 5000,
              totalCredit: 0,
              maxCredit: 0,
              minCredit: 0,
            }}
            formatValue={formatNaira}
          />
        )}
      </div> */}
    </div>
  );
}