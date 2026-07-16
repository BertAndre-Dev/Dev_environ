"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import type { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Plus, Search, Trash, Eye } from "lucide-react";
import { MeterEnergyUsageSection } from "@/components/charts/meter-energy-usage-section";
import { EstatePowerUsageSection } from "@/components/charts/estate-power-usage-section";
import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import Tab from "@/components/tabs/page";
import {
  getMeterUsage,
  type MeterUsageRange,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getCompanyEnergyConsumptionChart } from "@/redux/slice/company/energy-consumption/company-energy-consumption";
import { getCompanyEstateEnergyUsage } from "@/redux/slice/company/estate-energy-usage/company-estate-energy-usage";
import {
  deleteCompanyMeter,
  getCompanyMeterByAddressId,
  getCompanyMeters,
} from "@/redux/slice/company/meter-mgt/company-meter";
import type { Pagination } from "@/redux/slice/company/meter-mgt/company-meter-slice";
import CompanyAssignMeterForm from "@/components/company/meter-form/page";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { parseCompanyFromUser } from "../lib/company";

type AddressIdInput = string | { id: string; data?: Record<string, unknown> };

interface CompanyMeterRow {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: AddressIdInput;
  vendorData?: {
    name?: string;
    utilityName?: string;
  };
}

function toAddressIdString(
  addressId: AddressIdInput | null | undefined,
): string | null {
  if (addressId == null) return null;
  if (typeof addressId === "string") return addressId;
  if (typeof addressId === "object" && addressId?.id) return addressId.id;
  return null;
}

function toAddressData(addressId: AddressIdInput | null | undefined): Record<
  string,
  unknown
> | null {
  if (addressId == null) return null;
  if (typeof addressId === "object" && addressId?.data) return addressId.data;
  return null;
}

function formatAddressData(
  data: Record<string, unknown> | null | undefined,
): string {
  if (!data) return "—";
  const entries = Object.entries(data).filter(
    ([, v]) => v != null && String(v).trim() !== "",
  );
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
}

function getAllAddressKeys(data: CompanyMeterRow[]): string[] {
  const keys = new Set<string>();
  data.forEach((item) => {
    const addressData = toAddressData(item.addressId);
    if (addressData) {
      Object.keys(addressData).forEach((key) => keys.add(key));
    }
  });
  return Array.from(keys);
}

function getAddressColumns(data: CompanyMeterRow[]) {
  if (!data.length) return [];
  const addressKeys = getAllAddressKeys(data);
  return addressKeys.map((key) => ({
    key: `address_${key}`,
    header: key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase()),
    render: (item: CompanyMeterRow) => {
      const value = toAddressData(item.addressId)?.[key];
      if (value == null || String(value).trim() === "") return "—";
      return String(value);
    },
    exportValue: (item: CompanyMeterRow) => {
      const value = toAddressData(item.addressId)?.[key];
      return value == null ? "" : String(value);
    },
  }));
}

type EstateOption = { label: string; value: string };

const METER_TAB_TITLES = ["Chart Overview", "Meter Management"] as const;

export default function CompanyMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyId, setCompanyId] = useState("");
  const [assignMeter, setAssignMeter] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsAddressId, setDetailsAddressId] = useState<string | null>(null);
  const [detailsMeterNumber, setDetailsMeterNumber] = useState<string | null>(
    null,
  );
  const [meterUsageRange, setMeterUsageRange] =
    useState<MeterUsageRange>("weekly");
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [usageRange, setUsageRange] = useState<EstateEnergyUsageRange>("weekly");
  const [usageRefreshing, setUsageRefreshing] = useState(false);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [estateNameById, setEstateNameById] = useState<Record<string, string>>(
    {},
  );

  const { meters, pagination, loading, meterDetails, detailsLoading } =
    useSelector((state: RootState) => {
      const companyMeter = state.companyMeter;
      return {
        meters: (companyMeter?.meterList?.data || []) as CompanyMeterRow[],
        pagination: (companyMeter?.meterList?.pagination ??
          null) as Pagination | null,
        loading: companyMeter?.getMetersState === "isLoading",
        meterDetails: companyMeter?.meterDetails ?? null,
        detailsLoading:
          companyMeter?.getMeterByAddressIdState === "isLoading",
      };
    });

  const { meterUsage, meterUsageLoading, meterUsageMessage } = useSelector(
    (state: RootState) => ({
      meterUsage: state.residentMeter.meterUsage,
      meterUsageLoading:
        state.residentMeter.getMeterUsageState === "isLoading",
      meterUsageMessage: state.residentMeter.meterUsageMessage,
    }),
  );

  const { energyConsumptionChart, energyChartLoading } = useSelector(
    (state: RootState) => ({
      energyConsumptionChart: state.companyEnergyConsumption.chart,
      energyChartLoading:
        state.companyEnergyConsumption.chartStatus === "isLoading",
    }),
  );

  const {
    estateEnergyUsage,
    estateEnergyUsageLoading,
    estateEnergyUsageProgress,
    estateEnergyUsageMessage,
    estateEnergyUsageError,
  } = useSelector((state: RootState) => ({
    estateEnergyUsage: state.companyEstateEnergyUsage.usage,
    estateEnergyUsageLoading:
      state.companyEstateEnergyUsage.status === "isLoading",
    estateEnergyUsageProgress: state.companyEstateEnergyUsage.progress,
    estateEnergyUsageMessage: state.companyEstateEnergyUsage.message,
    estateEnergyUsageError: state.companyEstateEnergyUsage.error,
  }));

  const selectedEstateId = selectedEstate?.value ?? "";

  const estateOptions = useMemo<EstateOption[]>(
    () =>
      Object.entries(estateNameById)
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [estateNameById],
  );

  const pageSize = Number(pagination?.pageSize) || 10;

  const fetchMeters = useCallback(
    async (page = 1, search = searchQuery) => {
      if (!selectedEstateId) return;
      await dispatch(
        getCompanyMeters({
          page,
          limit: pageSize,
          search: search || undefined,
          estateId: selectedEstateId,
        }),
      ).unwrap();
    },
    [dispatch, selectedEstateId, pageSize, searchQuery],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company) {
          toast.warning("No company linked to your account.");
          return;
        }
        setCompanyId(company.id);
      } catch {
        toast.error("Failed to load company information.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedEstateId) return;
    fetchMeters(1).catch(() => {
      toast.error("Failed to fetch meters");
    });
  }, [selectedEstateId, searchQuery, fetchMeters]);

  useEffect(() => {
    const loadEstates = async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 500 }),
        ).unwrap();
        const estates: Array<{
          id?: string;
          _id?: string;
          name?: string;
        }> = res?.data ?? [];
        const map: Record<string, string> = {};
        for (const estate of estates) {
          const id = estate?.id ?? estate?._id;
          const name = estate?.name;
          if (id && name) map[String(id)] = String(name);
        }
        setEstateNameById(map);
      } catch {
        toast.error("Failed to load estates.");
      } finally {
        setEstatesLoading(false);
      }
    };
    loadEstates();
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getCompanyEstateEnergyUsage({
        estateId: selectedEstateId,
        range: usageRange,
      }),
    ).catch((error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to load estate energy usage.");
    });
  }, [dispatch, selectedEstateId, usageRange]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getCompanyEnergyConsumptionChart({
        estateId: selectedEstateId,
        period: energyPeriod,
      }),
    ).catch((error: { message?: string }) => {
      toast.error(
        error?.message ?? "Failed to load energy consumption chart.",
      );
    });
  }, [dispatch, selectedEstateId, energyPeriod]);

  const handleRefreshUsage = async () => {
    if (!selectedEstateId) return;
    setUsageRefreshing(true);
    try {
      await dispatch(
        getCompanyEstateEnergyUsage({
          estateId: selectedEstateId,
          range: usageRange,
          refresh: true,
        }),
      ).unwrap();
    } catch (error: unknown) {
      toast.error(
        (error as { message?: string })?.message ??
          "Failed to refresh estate energy usage.",
      );
    } finally {
      setUsageRefreshing(false);
    }
  };

  const chartEmptyMessage = useMemo(() => {
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found.";
    if (!selectedEstateId) return "Select an estate to view energy data.";
    return undefined;
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

  const vendChartEmptyMessage = useMemo(() => {
    if (chartEmptyMessage) return chartEmptyMessage;
    return "No vending data for this period yet.";
  }, [chartEmptyMessage]);

  const handleRefresh = async () => {
    try {
      await fetchMeters(Number(pagination?.currentPage) || 1);
    } catch {
      toast.error("Failed to refresh meter list");
    }
  };

  const handleAssignMeter = () => {
    setAssignMeter((prev) => !prev);
  };

  const handleViewDetails = (meter: CompanyMeterRow) => {
    const addressIdStr = toAddressIdString(meter.addressId);
    if (!addressIdStr) {
      toast.warning("No address ID for this meter");
      return;
    }
    setDetailsAddressId(addressIdStr);
    setDetailsMeterNumber(meter.meterNumber);
    setMeterUsageRange("weekly");
    setDetailsModalOpen(true);
    dispatch(getCompanyMeterByAddressId(addressIdStr)).catch(
      (err: { message?: string }) => {
        toast.error(err?.message ?? "Failed to load meter details");
      },
    );
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsAddressId(null);
    setDetailsMeterNumber(null);
  };

  useEffect(() => {
    if (!detailsModalOpen || !detailsMeterNumber) return;
    dispatch(
      getMeterUsage({ meterNumber: detailsMeterNumber, range: meterUsageRange }),
    ).catch((error: { message?: string }) => {
      toast.error(error?.message ?? "Failed to load meter energy usage.");
    });
  }, [dispatch, detailsModalOpen, detailsMeterNumber, meterUsageRange]);

  const handleDeleteMeter = async (meterId: string) => {
    if (!meterId) {
      toast.error("Meter ID is missing");
      return;
    }

    confirmDeleteToast({
      name: "this meter",
      onConfirm: async () => {
        const response = await dispatch(deleteCompanyMeter(meterId)).unwrap();
        toast.success(response?.message || "Meter deleted successfully");
        handleRefresh();
      },
    });
  };

  const columns = [
    { key: "createdAt", header: "Created Date" },
    { key: "meterNumber", header: "Meter Number" },
    ...getAddressColumns(meters),
    {
      key: "estateId",
      header: "Estate",
      render: (item: CompanyMeterRow) => {
        const id = item.estateId;
        if (!id) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="font-medium">{estateNameById[id] ?? id}</span>
        );
      },
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: CompanyMeterRow) => (
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
      render: (item: CompanyMeterRow) => (
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
      header: "Action",
      render: (item: CompanyMeterRow) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1"
            onClick={() => handleViewDetails(item)}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            size="sm"
            onClick={() => handleDeleteMeter(item.id!)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Energy Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor energy usage and manage meters across estates.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="w-full sm:w-56">
            <Select
              options={estateOptions}
              placeholder="Filter by estate"
              value={selectedEstate}
              onChange={(option) => setSelectedEstate(option)}
              isSearchable
              isLoading={estatesLoading}
              isDisabled={!estateOptions.length || estatesLoading}
              styles={{
                control: (base) => ({ ...base, cursor: "pointer" }),
                option: (base) => ({ ...base, cursor: "pointer" }),
                dropdownIndicator: (base) => ({
                  ...base,
                  cursor: "pointer",
                }),
                clearIndicator: (base) => ({
                  ...base,
                  cursor: "pointer",
                }),
              }}
            />
          </div>
          <Button
            onClick={handleAssignMeter}
            className="flex items-center gap-2 cursor-pointer"
            disabled={!companyId}
          >
            <Plus className="w-4 h-4" /> Add Meter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(() => {
          const stats = [
            {
              label: "Total Meters",
              value: pagination?.total ?? 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#D0DFF280]",
            },
            {
              label: "Active Meters",
              value: meters.filter((meter) => meter.isActive).length || 0,
              icon: IoSpeedometerOutline,
              color: "bg-[#CCE4DB80]",
            },
          ];

          return stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="font-heading text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            );
          });
        })()}
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
                    loading={
                      estatesLoading ||
                      (!!selectedEstateId && estateEnergyUsageLoading)
                    }
                    progress={estateEnergyUsageProgress}
                    range={usageRange}
                    onRangeChange={setUsageRange}
                    onRefresh={
                      selectedEstateId ? handleRefreshUsage : undefined
                    }
                    refreshing={usageRefreshing}
                    exportFileName={
                      selectedEstate
                        ? `estate_${selectedEstate.label.replace(/[^a-z0-9-_]/gi, "_")}_energy_usage`
                        : "estate_energy_usage"
                    }
                    emptyMessage={
                      chartEmptyMessage ??
                      estateEnergyUsageError ??
                      estateEnergyUsageMessage ??
                      "No energy usage data for this period."
                    }
                  />
                  <EnergyConsumptionOverTimeCard
                    data={energyConsumptionChart}
                    loading={
                      estatesLoading ||
                      (!!selectedEstateId && energyChartLoading)
                    }
                    period={energyPeriod}
                    onPeriodChange={setEnergyPeriod}
                    emptyMessage={vendChartEmptyMessage}
                  />
                </div>
              );
            case "Meter Management":
              return (
                <div className="relative space-y-6">
                  {loading && <Loader fullScreen label="Loading meters..." />}

                  <div
                    className={[
                      "space-y-6",
                      loading ? "pointer-events-none select-none" : "",
                    ].join(" ")}
                  >
                    <Card className="p-4">
                      <div className="relative w-full max-w-sm flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
                          <input
                            placeholder="Search by meter number."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setSearchQuery(searchInput);
                              }
                              if (e.key === "Escape") {
                                setSearchInput("");
                                setSearchQuery("");
                              }
                            }}
                            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        {searchInput.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(searchInput);
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition"
                          >
                            Search
                          </button>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <Table
                        columns={columns}
                        data={meters}
                        emptyMessage="No meters found."
                        showPagination
                        onSearch={(value) => setSearchInput(value)}
                        paginationInfo={{
                          total: pagination?.total || 0,
                          current: Number(pagination?.currentPage) || 1,
                          pageSize: Number(pagination?.pageSize) || 10,
                        }}
                        onPageChange={(page) => {
                          fetchMeters(page).catch(() =>
                            toast.error("Failed to fetch meters"),
                          );
                        }}
                        enableExport
                        exportFileName="company-meters"
                        onExportRequest={async () => {
                          if (!selectedEstateId) return [];
                          const res = await dispatch(
                            getCompanyMeters({
                              page: 1,
                              limit: 50000,
                              estateId: selectedEstateId,
                            }),
                          ).unwrap();
                          return res?.data ?? [];
                        }}
                      />
                    </Card>
                  </div>
                </div>
              );
            default:
              return null;
          }
        }}
      />

      {assignMeter && companyId && (
        <Modal visible={assignMeter} onClose={handleAssignMeter}>
          <CompanyAssignMeterForm
            companyId={companyId}
            close={handleAssignMeter}
            refresh={handleRefresh}
          />
        </Modal>
      )}

      <Modal
        visible={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        contentClassName="md:w-[min(720px,95vw)] lg:w-[min(800px,95vw)]"
      >
        <div className="space-y-6 p-4 pr-8">
          <h2 className="text-lg font-semibold">Meter details</h2>
          {detailsLoading ? (
            <div className="py-6 flex justify-center">
              <Loader label="Loading details..." />
            </div>
          ) : meterDetails ? (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Meter number</dt>
                <dd className="font-medium">
                  {meterDetails.meterNumber ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estate</dt>
                <dd className="font-medium">
                  {meterDetails.estateId
                    ? (estateNameById[meterDetails.estateId] ??
                      meterDetails.estateId)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      meterDetails.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {meterDetails.isActive ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      meterDetails.isAssigned
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {meterDetails.isAssigned ? "Yes" : "No"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="font-medium">
                  {formatAddressData(toAddressData(meterDetails.addressId))}
                </dd>
              </div>
              {meterDetails.lastCredit != null && (
                <div>
                  <dt className="text-muted-foreground">Last credit</dt>
                  <dd className="font-medium">{meterDetails.lastCredit}</dd>
                </div>
              )}
              {meterDetails.createdAt && (
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {new Date(meterDetails.createdAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {meterDetails.vendorData &&
                typeof meterDetails.vendorData === "object" && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Vendor</dt>
                      <dd className="font-medium">
                        {meterDetails.vendorData.name ?? "—"}
                      </dd>
                    </div>
                    {meterDetails.vendorData.utilityName && (
                      <div>
                        <dt className="text-muted-foreground">Utility</dt>
                        <dd className="font-medium">
                          {meterDetails.vendorData.utilityName}
                        </dd>
                      </div>
                    )}
                  </>
                )}
            </dl>
          ) : detailsAddressId ? (
            <p className="text-muted-foreground py-4">
              Could not load meter details.
            </p>
          ) : null}

          {detailsMeterNumber ? (
            <MeterEnergyUsageSection
              data={meterUsage}
              loading={meterUsageLoading}
              range={meterUsageRange}
              onRangeChange={setMeterUsageRange}
              exportFileName={`meter_${detailsMeterNumber}_energy_usage`}
              emptyMessage={
                meterUsageMessage ||
                meterUsage?.hint ||
                "No energy usage data for this period. The meter may be offline or have no history yet."
              }
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
