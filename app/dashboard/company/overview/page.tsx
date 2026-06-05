"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { toast } from "react-toastify";

import { EnergyConsumptionOverTimeCard } from "@/components/charts/energy-consumption-over-time-card";
import { TransactionSummaryCard } from "@/components/charts/transaction-summary-card";
import { parseCompanyFromUser } from "@/app/dashboard/company/lib/company";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  getCompanyEnergyConsumptionAddressOptions,
  getCompanyEnergyConsumptionChart,
} from "@/redux/slice/company/energy-consumption/company-energy-consumption";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { getCompanyTransactionSummary } from "@/redux/slice/company/transaction-summary/company-transaction-summary";
import type { AppDispatch, RootState } from "@/redux/store";

type EstateOption = { label: string; value: string };

function extractErrorMessage(err: unknown, fallback: string): string {
  return err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message?: string }).message === "string"
    ? (err as { message: string }).message
    : fallback;
}

export default function CompanyOverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Company");
  const [estateOptions, setEstateOptions] = useState<EstateOption[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [estatesLoading, setEstatesLoading] = useState(true);
  const [energyPeriod, setEnergyPeriod] =
    useState<EnergyConsumptionPeriod>("weekly");
  const [selectedAddressId, setSelectedAddressId] = useState("all");

  const selectedEstateId = selectedEstate?.value ?? "";

  const { transactionSummary, transactionSummaryLoading } = useSelector(
    (state: RootState) => ({
      transactionSummary: state.companyTransactionSummary.summary,
      transactionSummaryLoading:
        state.companyTransactionSummary.status === "isLoading",
    }),
  );

  const {
    energyConsumptionChart,
    energyAddressOptions,
    energyChartLoading,
    energyAddressOptionsLoading,
  } = useSelector((state: RootState) => ({
    energyConsumptionChart: state.companyEnergyConsumption.chart,
    energyAddressOptions: state.companyEnergyConsumption.addressOptions,
    energyChartLoading:
      state.companyEnergyConsumption.chartStatus === "isLoading",
    energyAddressOptionsLoading:
      state.companyEnergyConsumption.addressOptionsStatus === "isLoading",
  }));

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const company = parseCompanyFromUser(data);
        if (!company?.id) {
          toast.error("No company ID found for this user.");
          return;
        }
        setCompanyId(company.id);
        setCompanyName(company.name);
      } catch {
        toast.error("Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      setEstatesLoading(true);
      try {
        const res = await dispatch(
          getCompanyEstates({ page: 1, limit: 200 }),
        ).unwrap();
        const options =
          (res?.data ?? [])
            .map((e: { id?: string; _id?: string; name?: string }) => {
              const value = String(e?._id || e?.id || "").trim();
              if (!value) return null;
              return { label: e?.name ?? "Unnamed estate", value };
            })
            .filter((x: EstateOption | null): x is EstateOption =>
              Boolean(x),
            ) ?? [];
        setEstateOptions(options);
        if (options.length > 0) {
          setSelectedEstate((current) => current ?? options[0]);
        }
      } catch {
        toast.error("Failed to fetch estates.");
        setEstateOptions([]);
      } finally {
        setEstatesLoading(false);
      }
    })();
  }, [dispatch, companyId]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(getCompanyTransactionSummary({ estateId: selectedEstateId })).catch(
      (err: unknown) => {
        toast.error(
          extractErrorMessage(err, "Failed to load transaction summary."),
        );
      },
    );
  }, [dispatch, selectedEstateId]);

  useEffect(() => {
    if (!selectedEstateId) return;
    setSelectedAddressId("all");
    dispatch(
      getCompanyEnergyConsumptionAddressOptions({ estateId: selectedEstateId }),
    ).catch((err: unknown) => {
      toast.error(
        extractErrorMessage(err, "Failed to load address options."),
      );
    });
  }, [dispatch, selectedEstateId]);

  useEffect(() => {
    if (!selectedEstateId) return;
    dispatch(
      getCompanyEnergyConsumptionChart({
        estateId: selectedEstateId,
        period: energyPeriod,
        addressId: selectedAddressId,
      }),
    ).catch((err: unknown) => {
      toast.error(
        extractErrorMessage(err, "Failed to load energy consumption chart."),
      );
    });
  }, [dispatch, selectedEstateId, energyPeriod, selectedAddressId]);

  const transactionEmptyMessage = useMemo(() => {
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found for this company.";
    if (!selectedEstateId) return "Select an estate to view transactions.";
    return "No transaction data to display.";
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

  const energyEmptyMessage = useMemo(() => {
    if (estatesLoading) return "Loading estates…";
    if (!estateOptions.length) return "No estates found for this company.";
    if (!selectedEstateId) return "Select an estate to view energy data.";
    return "No vending data for this period yet.";
  }, [estatesLoading, estateOptions.length, selectedEstateId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-heading text-3xl font-bold">Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s an overview for{" "}
            <span className="text-[18px] font-bold uppercase text-black underline">
              {companyName}
            </span>
            .
          </p>
        </div>

        <div className="w-48 min-w-[12rem]">
          <Select
            options={estateOptions}
            placeholder="Filter by estate"
            value={selectedEstate}
            onChange={(option) => setSelectedEstate(option)}
            isSearchable
            isDisabled={!estateOptions.length || estatesLoading}
            styles={{
              control: (base) => ({ ...base, cursor: "pointer" }),
              option: (base) => ({ ...base, cursor: "pointer" }),
              dropdownIndicator: (base) => ({ ...base, cursor: "pointer" }),
              clearIndicator: (base) => ({ ...base, cursor: "pointer" }),
            }}
          />
        </div>
      </div>

      <TransactionSummaryCard
        data={transactionSummary}
        loading={transactionSummaryLoading || estatesLoading}
        emptyMessage={transactionEmptyMessage}
      />

      <EnergyConsumptionOverTimeCard
        data={energyConsumptionChart}
        loading={energyChartLoading}
        period={energyPeriod}
        onPeriodChange={setEnergyPeriod}
        showAddressFilter
        addressOptions={energyAddressOptions}
        addressValue={selectedAddressId}
        onAddressChange={setSelectedAddressId}
        addressFilterLabel="Address"
        addressFilterLoading={energyAddressOptionsLoading}
        emptyMessage={energyEmptyMessage}
      />
    </div>
  );
}
