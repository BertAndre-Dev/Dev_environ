"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, Link, Zap } from "lucide-react";
import {
  getAllEstateMeter,
  getVendingStatsByEstate,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";
import { getAdminEnergyConsumptionChart } from "@/redux/slice/admin/energy-consumption/admin-energy-consumption";
import { getEstateEnergyUsage } from "@/redux/slice/admin/estate-energy-usage/admin-estate-energy-usage";
import { getEstateRealtimeReadings } from "@/redux/slice/admin/estate-realtime-readings/admin-estate-realtime-readings";
import { formatRealtimeEnergyKwh } from "@/lib/estate-realtime-readings";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import AssignMeterForm from "@/components/admin/meter-form/page";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import Tab from "@/components/tabs/page";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: {
    id: string;
    data: Record<string, string>;
  };
  vendorData?: VendorData;
}

const PAGE_LIMIT = 10;

const METER_TAB_TITLES = ["Chart Overview", "Meter Management"] as const;

function formatPurchasedAmount(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");

  const { allAdminMeters, pagination, loading } = useSelector(
    (state: RootState) => {
      const adminMeterState = state.adminMeter as any;
      return {
        allAdminMeters: adminMeterState?.allAdminMeters?.data || [],
        pagination: adminMeterState?.allAdminMeters?.pagination || {},
        loading:
          adminMeterState.getAllEstateMeterState === "isLoading" ||
          adminMeterState.getMeterState === "isLoading",
      };
    },
  );

  const vendingStats = useSelector(
    (state: RootState) => state.adminMeter.vendingStatsByEstate,
  );
  const vendingStatsLoading =
    useSelector(
      (state: RootState) => state.adminMeter.getVendingStatsByEstateState,
    ) === "isLoading";

  const { energyConsumptionChart, energyChartLoading } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.adminEnergyConsumption.chart,
      energyChartLoading:
        state.adminEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateRealtimeReadings,
    estateRealtimeReadingsLoading,
  } = useSelector((state: RootState) => ({
    estateRealtimeReadings: state.adminEstateRealtimeReadings.readings,
    estateRealtimeReadingsLoading:
      state.adminEstateRealtimeReadings.status === "isLoading",
  }));

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.adminEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.adminEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.adminEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.adminEstateEnergyUsage.message,
    estateEnergyUsageError: state.adminEstateEnergyUsage.error,
  }));

  const fetchMeters = useCallback(
    async (page = 1) => {
      if (!estateId) return;
      await dispatch(
        getAllEstateMeter({
          estateId,
          page,
          limit: PAGE_LIMIT,
          search: search || undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, search],
  );

  // Bootstrap signed-in user and estate only (no meter fetch here).
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const foundEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateIdValue =
          typeof foundEstateId === "string"
            ? foundEstateId
            : foundEstateId?._id || foundEstateId?.id || "";

        const estateFromId =
          (foundEstateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!estateIdValue) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(estateIdValue);
      } catch (error: any) {
        toast.error(error?.message);
      }
    })();
  }, [dispatch]);

  // Single fetch when estate or search changes.
  useEffect(() => {
    if (!estateId) return;
    fetchMeters(1).catch((error: any) => toast.error(error?.message));
  }, [estateId, fetchMeters]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getVendingStatsByEstate({ estateId })).catch((error: any) =>
      toast.error(error?.message ?? "Failed to load vending statistics."),
    );
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateRealtimeReadings({ estateId })).catch(
      (error: { message?: string }) => {
        toast.error(
          error?.message ?? "Failed to load estate realtime usage.",
        );
      },
    );
  }, [dispatch, estateId]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getEstateEnergyUsage({ estateId, range: usageRange })).catch(
      (error: { message?: string }) => {
        toast.error(error?.message ?? "Failed to load estate energy usage.");
      },
    );
  }, [dispatch, estateId, usageRange]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      getAdminEnergyConsumptionChart({
        estateId,
        period: energyPeriod,
      }),
    ).catch((error: { message?: string }) => {
      toast.error(
        error?.message ?? "Failed to load energy consumption chart.",
      );
    });
  }, [dispatch, estateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!estateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getEstateEnergyUsage({
          estateId,
          range: usageRange,
          refresh: true,
        }),
      ).unwrap();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to refresh estate energy usage.");
    } finally {
      setUsageRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchMeters(Number(pagination?.currentPage) || 1),
        estateId
          ? dispatch(getVendingStatsByEstate({ estateId })).unwrap()
          : Promise.resolve(),
      ]);
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleOpenModal = (meter?: AdminMeterData) => {
    setSelectedMeter(meter || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
  };

  const getAllAddressKeys = (data: AdminMeterData[]) => {
    const keys = new Set<string>();
    data.forEach((item) => {
      if (item.addressId?.data) {
        Object.keys(item.addressId.data).forEach((key) => keys.add(key));
      }
    });
    return Array.from(keys);
  };

  const getAddressColumns = (data: AdminMeterData[]) => {
    if (!data.length) return [];
    const addressKeys = getAllAddressKeys(data);
    return addressKeys.map((key) => ({
      key: `address_${key}`,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      render: (item: AdminMeterData) => item.addressId?.data?.[key] ?? "-",
    }));
  };

  const columns = [
    { key: "createdAt", header: "Created Date" },
    { key: "meterNumber", header: "Meter Number" },
    ...getAddressColumns(allAdminMeters),
    {
      key: "isActive",
      header: "Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "isAssigned",
      header: "Assigned Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isAssigned
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isAssigned ? "Assigned" : "Not Assigned"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Assign Meter",
      render: (item: AdminMeterData) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
            className="hover:bg-blue-100"
          >
            <Link className="w-4 h-4 text-blue-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading estate meters..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          loading ? "blur-sm opacity-60 pointer-events-none select-none" : "",
        ].join(" ")}
      >
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Energy Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor energy usage and manage all meters in{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName || ""}
          </span>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Meters</p>
              <p className="font-heading text-2xl font-bold mt-2 tabular-nums tracking-tight">
                {pagination?.total ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-[#FEE6D480] p-3">
              <IoSpeedometerOutline className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Amount Purchased
              </p>
              <p className="font-heading text-2xl font-bold mt-2 tabular-nums tracking-tight">
                {vendingStatsLoading
                  ? "—"
                  : formatPurchasedAmount(
                      Number(vendingStats?.totalAmount) || 0,
                    )}
              </p>
            </div>
            <div className="rounded-lg bg-[#D0DFF280] p-3">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="font-heading text-2xl font-bold mt-2 tabular-nums tracking-tight">
                {estateRealtimeReadingsLoading
                  ? "—"
                  : formatRealtimeEnergyKwh(
                      estateRealtimeReadings?.totalEnergy,
                    )}
              </p>
            </div>
            <div className="rounded-lg bg-[#CCE4DB80] p-3">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <Tab
        titles={[...METER_TAB_TITLES]}
        renderContent={(activeTab) => {
          switch (activeTab) {
            case "Chart Overview":
              return (
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
              );
            case "Meter Management":
              return (
                <div className="space-y-6">
                  <Card className="p-4">
                    <input
                      type="text"
                      placeholder="Search by meter number"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </Card>

                  <Card className="p-4">
                    <Table
                      columns={columns}
                      data={allAdminMeters || []}
                      emptyMessage="No meter found."
                      showPagination
                      onSearch={(value) => setSearch(value)}
                      paginationInfo={{
                        total: pagination?.total || 0,
                        current: Number(pagination?.currentPage) || 1,
                        pageSize: Number(pagination?.pageSize) || 10,
                      }}
                      onPageChange={(page) => {
                        fetchMeters(page).catch(() =>
                          toast.error("Failed to change page"),
                        );
                      }}
                      enableExport
                      exportFileName="meters"
                      onExportRequest={
                        estateId
                          ? async () => {
                              const res = await dispatch(
                                getAllEstateMeter({
                                  estateId,
                                  page: 1,
                                  limit: 50000,
                                }),
                              ).unwrap();
                              return res?.data ?? [];
                            }
                          : undefined
                      }
                    />
                  </Card>
                </div>
              );
            default:
              return null;
          }
        }}
      />

      {open && estateId && selectedMeter && (
        <Modal visible={open} onClose={handleCloseModal}>
          <AssignMeterForm
            close={handleCloseModal}
            refresh={handleRefresh}
            meterNumber={selectedMeter.meterNumber}
          />
        </Modal>
      )}
      </div>
    </div>
  );
}
