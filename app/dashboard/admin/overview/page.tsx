"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import BillsOverview from "@/components/charts/bills-overview";
import TransactionsChart from "@/components/charts/transactions-chart";
import MeterStatusPie from "@/components/charts/meter-status-pie";
import MeterTrendChart from "@/components/charts/meter-trend-chart";
import {
  OccupancyDistributionDonutCard,
  type OccupancyDistributionData,
} from "@/components/charts/occupancy-distribution-donut-card";
import { mapResidentTypeBreakdownToChartData } from "@/lib/resident-type-breakdown-chart";
import { extractEstateIdFromUser, extractEstateNameFromUser } from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getResidentTypeBreakdown } from "@/redux/slice/admin/user-analytics/user-analytics";
import type { AppDispatch, RootState } from "@/redux/store";

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

const EMPTY_RESIDENT_CHART: OccupancyDistributionData = {
  totalResidents: 0,
  occupiedPercentage: 0,
  vacantPercentage: 0,
};

export default function AdminOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const [chartView, setChartView] = useState("bills");
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");

  const { residentTypeBreakdown, residentTypeLoading } = useSelector(
    (state: RootState) => ({
      residentTypeBreakdown: state.adminUserAnalytics.residentTypeBreakdown,
      residentTypeLoading:
        state.adminUserAnalytics.residentTypeBreakdownStatus === "isLoading",
    }),
  );

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
    dispatch(getResidentTypeBreakdown({ estateId })).catch((err: unknown) => {
      const msg =
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
          ? (err as { message: string }).message
          : "Failed to load resident breakdown.";
      toast.error(msg);
    });
  }, [dispatch, estateId]);

  const residentDistributionData = useMemo((): OccupancyDistributionData => {
    if (!residentTypeBreakdown) return EMPTY_RESIDENT_CHART;
    return mapResidentTypeBreakdownToChartData(residentTypeBreakdown);
  }, [residentTypeBreakdown]);

  /** 🔥 Dummy Stats */
  const stats = [
    {
      title: "Bills collected",
      value: formatNaira(15000000),
      change: "450 paid",
      trend: "up",
      icon: FileText,
      color: "bg-[#E6F4EA] text-[#007A4D]",
    },
    {
      title: "Transactions",
      value: "2,340",
      change: `Net ${formatNaira(12000000)}`,
      trend: "up",
      icon: DollarSign,
      color: "bg-[#D0DFF280] text-[#0150AC]",
    },
    {
      title: "Meters",
      value: "1,200",
      change: "900 assigned",
      trend: "up",
      icon: TrendingUp,
      color: "bg-[#FEE6D480] text-[#B45309]",
    },
    {
      title: "Active bills",
      value: "320",
      change: "40 suspended",
      trend: "up",
      icon: Users,
      color: "bg-[#FFF4E5] text-[#FF8A00]",
    },
  ];

  /** 📊 Dummy Data */
  const billsChartData = [
    { name: "Electricity", value: 7000000, fill: "#0150AC" },
    { name: "Water", value: 3000000, fill: "#FA8128" },
    { name: "Security", value: 2000000, fill: "#10b981" },
  ];

  const transactionTrendData = [
    { label: "Jan", value: 2000000 },
    { label: "Feb", value: 4000000 },
    { label: "Mar", value: 3000000 },
    { label: "Apr", value: 5000000 },
  ];

  const transactionTypeData = [
    { label: "Credit", value: 12000000 },
    { label: "Debit", value: 3000000 },
  ];

  const chargeBreakdownData = [
    { label: "Electricity", value: 6000000 },
    { label: "Water", value: 2000000 },
    { label: "Service", value: 1500000 },
  ];

  const meterAssignmentData = [
    { name: "Assigned", value: 900 },
    { name: "Unassigned", value: 300 },
  ];

  const meterTrendData = [
    { label: "Jan", value: 200 },
    { label: "Feb", value: 300 },
    { label: "Mar", value: 250 },
  ];

  const estateOptions = [{ label: estateName, value: estateId ?? "1" }];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of{" "}
          <span className="font-bold uppercase">{estateName}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex justify-between">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUpRight size={16} />
                  {stat.change}
                </div>
              </div>
              <p className="mt-3 text-sm">{stat.title}</p>
              <h2 className="text-2xl font-bold">{stat.value}</h2>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OccupancyDistributionDonutCard
          title="Occupancy Distribution"
          data={residentDistributionData}
          primaryLabel="Owner"
          secondaryLabel="Tenant"
          loading={residentTypeLoading}
          emptyMessage="No resident data to display"
        />
      </div>

      {/* Chart Selector */}
      <div className="space-y-4">
        <Select
          options={[
            { label: "Bills overview", value: "bills" },
            { label: "Transaction trend", value: "transactions" },
            { label: "Meter", value: "meter" },
          ]}
          value={chartView}
          onChange={(e) => setChartView(e.target.value)}
          className="max-w-xs"
        />

        {/* Charts */}
        {chartView === "bills" && (
          <Card className="p-4">
            <BillsOverview title="Bills" data={billsChartData} />
          </Card>
        )}

        {chartView === "transactions" && (
          <>
            <TransactionsChart
              title="Transaction trend"
              data={transactionTrendData}
              estateOptions={estateOptions}
            />

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <TransactionsChart
                title="Credit vs Debit"
                data={transactionTypeData}
                estateOptions={estateOptions}
              />
              <TransactionsChart
                title="Charge breakdown"
                data={chargeBreakdownData}
                estateOptions={estateOptions}
              />
            </div>
          </>
        )}

        {chartView === "meter" && (
          <div className="grid md:grid-cols-2 gap-6">
            <MeterStatusPie
              title="Meter Assignment"
              data={meterAssignmentData}
            />
            <MeterTrendChart
              title="Meter Trend"
              data={meterTrendData}
            />
          </div>
        )}
      </div>
    </div>
  );
}