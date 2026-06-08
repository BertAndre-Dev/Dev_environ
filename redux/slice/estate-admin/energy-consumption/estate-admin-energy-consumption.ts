import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { formatAddressEntryLabel } from "@/lib/address";
import {
  mapVendAnalyticsToEnergyConsumption,
  type EnergyConsumptionPeriod,
  type VendAnalyticsChartResponse,
} from "@/lib/energy-consumption-chart";

export type EstateAdminAddressFilterOption = { label: string; value: string };

const ALL_ADDRESSES_OPTION: EstateAdminAddressFilterOption = {
  label: "Addresses",
  value: "all",
};

type AddressFieldEntry = {
  id?: string;
  _id?: string;
  data?: Record<string, unknown>;
};

function formatEntryLabel(entry: AddressFieldEntry): string {
  const id = entry.id ?? entry._id ?? "";
  const formatted = formatAddressEntryLabel(entry.data);
  if (formatted) return formatted;
  const data = entry.data ?? {};
  const fallback = Object.entries(data)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return fallback || id;
}

/** Loads estate address entries for the energy chart address filter. */
export const getEstateAdminEnergyConsumptionAddressOptions = createAsyncThunk(
  "estate-admin-energy-consumption/getAddressOptions",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const fieldsRes = await axiosInstance.get(
        `/api/v1/address-mgt/estate/${estateId}/fields`,
      );
      const fields = fieldsRes.data?.data ?? [];
      if (!Array.isArray(fields) || fields.length === 0) {
        return [ALL_ADDRESSES_OPTION];
      }

      const entriesById = new Map<string, EstateAdminAddressFilterOption>();

      for (const field of fields) {
        const fieldId = field.id ?? field._id;
        if (!fieldId) continue;

        const params = new URLSearchParams({
          fieldId: String(fieldId),
          page: "1",
          limit: "500",
        });
        const entryRes = await axiosInstance.get(
          `/api/v1/address-mgt/field-entries?${params.toString()}`,
        );
        const entries: AddressFieldEntry[] = entryRes.data?.data ?? [];
        for (const entry of entries) {
          const id = entry.id ?? entry._id;
          if (!id || entriesById.has(id)) continue;
          entriesById.set(id, { label: formatEntryLabel(entry), value: id });
        }
      }

      const sorted = [...entriesById.values()].sort((a, b) =>
        a.label.localeCompare(b.label),
      );
      return [ALL_ADDRESSES_OPTION, ...sorted];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch address options.",
      });
    }
  },
);

/** GET /api/v1/meters/estate/{estateId}/vend-analytics/chart (estate admin overview) */
export const getEstateAdminEnergyConsumptionChart = createAsyncThunk(
  "estate-admin-energy-consumption/getChart",
  async (
    {
      estateId,
      period = "weekly",
      addressId,
    }: {
      estateId: string;
      period?: EnergyConsumptionPeriod;
      addressId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const scopedAddressId =
        addressId && addressId !== "all" ? addressId : undefined;

      const params: Record<string, string> = { period };
      if (scopedAddressId) params.addressId = scopedAddressId;

      const [amountRes, unitsRes] = await Promise.all([
        axiosInstance.get<VendAnalyticsChartResponse>(
          `/api/v1/meters/estate/${estateId}/vend-analytics/chart`,
          { params: { ...params, metric: "value" } },
        ),
        axiosInstance.get<VendAnalyticsChartResponse>(
          `/api/v1/meters/estate/${estateId}/vend-analytics/chart`,
          { params: { ...params, metric: "unit" } },
        ),
      ]);

      const chart = mapVendAnalyticsToEnergyConsumption(
        amountRes.data,
        unitsRes.data,
        scopedAddressId,
      );

      return { chart };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch energy consumption chart.",
      });
    }
  },
);
