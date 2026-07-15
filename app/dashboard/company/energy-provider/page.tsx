"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Settings2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import Loader from "@/components/ui/Loader";
import type { AppDispatch, RootState } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import {
  getCompanyEnergyProviderConfigs,
  type EnergyProviderConfigRow,
} from "@/redux/slice/company/energy-provider-config/company-energy-provider-config";
import { getCompanyEnergyProviderVends } from "@/redux/slice/company/energy-provider-vends/company-energy-provider-vends";
import {
  energyProviderDisplayName,
  formatCommissionPercent,
  formatCommissionRecipient,
  formatEnergyProviderDate,
} from "@/lib/energy-provider-list";
import { parseCompanyFromUser } from "../lib/company";
import CompanyEnergyProviderCommissionForm from "./components/CompanyEnergyProviderCommissionForm";
import EnergyProviderVendsTab from "@/app/dashboard/super-admin/energy-provider/components/EnergyProviderVendsTab";

const PAGE_SIZE = 10;

type EstateOption = { label: string; value: string };
type ActiveTab = "configurations" | "vend-history";

export default function CompanyEnergyProviderPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("configurations");
  const [configOpen, setConfigOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(null);
  const [loadingEstates, setLoadingEstates] = useState(false);
  const [vendsPage, setVendsPage] = useState(1);
  const [vendsStartDate, setVendsStartDate] = useState("");
  const [vendsEndDate, setVendsEndDate] = useState("");

  const { list, pagination, loadingConfigs } = useSelector((state: RootState) => ({
    list: state.companyEnergyProviderConfig.list,
    pagination: state.companyEnergyProviderConfig.pagination,
    loadingConfigs:
      state.companyEnergyProviderConfig.getListStatus === "isLoading",
  }));

  const { vends, vendsPagination, loadingVends } = useSelector(
    (state: RootState) => ({
      vends: state.companyEnergyProviderVends.list,
      vendsPagination: state.companyEnergyProviderVends.pagination,
      loadingVends: state.companyEnergyProviderVends.status === "isLoading",
    }),
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
    if (!companyId) return;
    (async () => {
      setLoadingEstates(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 500 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption => Boolean(x)) ??
          [];
        setEstateOptions(options);
      } catch {
        toast.error("Failed to load estates");
        setEstateOptions([]);
      } finally {
        setLoadingEstates(false);
      }
    })();
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  const fetchConfigs = useCallback(
    (page = 1) => {
      if (!selectedEstate?.value) return Promise.resolve();
      return dispatch(
        getCompanyEnergyProviderConfigs({
          estateId: selectedEstate.value,
          estateName: selectedEstate.label,
          page,
          limit: PAGE_SIZE,
        }),
      ).unwrap();
    },
    [dispatch, selectedEstate],
  );

  const fetchVends = useCallback(
    (page = 1) => {
      if (!selectedEstate?.value) return Promise.resolve();
      const shouldApplyDate = Boolean(vendsStartDate && vendsEndDate);
      return dispatch(
        getCompanyEnergyProviderVends({
          estateId: selectedEstate.value,
          page,
          limit: PAGE_SIZE,
          startDate: shouldApplyDate ? vendsStartDate : undefined,
          endDate: shouldApplyDate ? vendsEndDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch, selectedEstate, vendsStartDate, vendsEndDate],
  );

  useEffect(() => {
    if (activeTab !== "configurations" || !selectedEstate?.value) return;
    fetchConfigs(1).catch(() =>
      toast.error("Failed to load energy provider configurations"),
    );
  }, [activeTab, selectedEstate, fetchConfigs]);

  useEffect(() => {
    if (activeTab !== "vend-history" || !selectedEstate?.value) return;
    fetchVends(vendsPage).catch(() => toast.error("Failed to load vend history"));
  }, [activeTab, selectedEstate, vendsPage, fetchVends]);

  const configColumns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Created",
        render: (item: EnergyProviderConfigRow) =>
          formatEnergyProviderDate(item.createdAt),
        exportValue: (item: EnergyProviderConfigRow) => item.createdAt ?? "",
      },
      {
        key: "name",
        header: "Energy provider",
        render: (item: EnergyProviderConfigRow) =>
          energyProviderDisplayName(item),
        exportValue: (item: EnergyProviderConfigRow) =>
          energyProviderDisplayName(item),
      },
      {
        key: "email",
        header: "Email",
      },
      {
        key: "commissionPercent",
        header: "Commission",
        render: (item: EnergyProviderConfigRow) =>
          formatCommissionPercent(item.commissionPercent),
        exportValue: (item: EnergyProviderConfigRow) =>
          `${item.commissionPercent}%`,
      },
      {
        key: "commissionRecipient",
        header: "Recipient",
        render: (item: EnergyProviderConfigRow) =>
          formatCommissionRecipient(item.commissionRecipient),
        exportValue: (item: EnergyProviderConfigRow) =>
          item.commissionRecipient ?? "",
      },
      {
        key: "isActive",
        header: "Status",
        render: (item: EnergyProviderConfigRow) => (
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
        exportValue: (item: EnergyProviderConfigRow) =>
          item.isActive ? "Active" : "Inactive",
      },
    ],
    [],
  );

  const handleConfigSuccess = () => {
    setConfigOpen(false);
    fetchConfigs(pagination?.currentPage ?? 1).catch(() =>
      toast.error("Failed to refresh energy provider configurations"),
    );
  };

  const handleEstateChange = (option: EstateOption | null) => {
    setSelectedEstate(option);
    setVendsPage(1);
  };

  const tabLoading =
    loadingEstates ||
    (activeTab === "configurations" && loadingConfigs) ||
    (activeTab === "vend-history" && loadingVends);

  return (
    <div className="relative space-y-6">
      {tabLoading && <Loader fullScreen label="Loading..." />}

      <div
        className={[
          "space-y-6",
          tabLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Energy Provider Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View configurations and vend history for estates under your company.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="w-full sm:w-56">
              <Select
                options={estateOptions}
                value={selectedEstate}
                onChange={handleEstateChange}
                isLoading={loadingEstates}
                placeholder="Filter by estate"
                isSearchable
              />
            </div>

            <Button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex items-center justify-center gap-2 cursor-pointer"
              disabled={!selectedEstate?.value || !companyId}
            >
              <Settings2 className="w-4 h-4" />
              Configure commission
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex gap-2 border-b border-border overflow-x-auto mb-4">
            {[
              { id: "configurations" as const, label: "Configurations" },
              { id: "vend-history" as const, label: "Vend history" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "vend-history") setVendsPage(1);
                }}
                className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "configurations" ? (
            <Table
              columns={configColumns}
              data={list}
              emptyMessage={
                selectedEstate?.value
                  ? "No energy provider configurations found for this estate"
                  : "Select an estate to view configurations"
              }
              showPagination
              paginationInfo={{
                total: pagination?.total ?? 0,
                current: pagination?.currentPage ?? 1,
                pageSize: pagination?.pageSize ?? PAGE_SIZE,
              }}
              onPageChange={(page) => {
                fetchConfigs(page).catch(() =>
                  toast.error("Failed to change page"),
                );
              }}
              enableExport
              exportFileName="energy-provider-configs"
              onExportRequest={async () => {
                if (!selectedEstate?.value) return [];
                const res = await dispatch(
                  getCompanyEnergyProviderConfigs({
                    estateId: selectedEstate.value,
                    estateName: selectedEstate.label,
                    page: 1,
                    limit: 50000,
                  }),
                ).unwrap();
                return res.data;
              }}
            />
          ) : (
            <EnergyProviderVendsTab
              data={vends}
              startDate={vendsStartDate}
              endDate={vendsEndDate}
              onDateRangeChange={({ startDate, endDate }) => {
                setVendsStartDate(startDate);
                setVendsEndDate(endDate);
                setVendsPage(1);
              }}
              paginationInfo={{
                total: vendsPagination?.total ?? 0,
                current: vendsPagination?.currentPage ?? 1,
                pageSize: vendsPagination?.pageSize ?? PAGE_SIZE,
              }}
              onPageChange={setVendsPage}
              onExportRequest={async () => {
                if (!selectedEstate?.value) return [];
                const shouldApplyDate = Boolean(vendsStartDate && vendsEndDate);
                const res = await dispatch(
                  getCompanyEnergyProviderVends({
                    estateId: selectedEstate.value,
                    page: 1,
                    limit: 50000,
                    startDate: shouldApplyDate ? vendsStartDate : undefined,
                    endDate: shouldApplyDate ? vendsEndDate : undefined,
                  }),
                ).unwrap();
                return res.data;
              }}
            />
          )}
        </Card>
      </div>

      {configOpen && companyId && (
        <Modal
          visible={configOpen}
          onClose={() => setConfigOpen(false)}
          contentClassName="md:w-[55%] lg:w-[45%] xl:w-[40%]"
        >
          <CompanyEnergyProviderCommissionForm
            companyId={companyId}
            estateOptions={estateOptions}
            defaultEstateId={selectedEstate?.value}
            onClose={() => setConfigOpen(false)}
            onSuccess={handleConfigSuccess}
          />
        </Modal>
      )}
    </div>
  );
}
