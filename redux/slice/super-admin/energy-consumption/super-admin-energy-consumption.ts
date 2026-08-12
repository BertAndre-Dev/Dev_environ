import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import {
  mapVendAnalyticsToEnergyConsumption,
  type EnergyConsumptionPeriod,
  type VendAnalyticsChartResponse,
} from "@/lib/energy-consumption-chart";

/** GET /api/v1/meters/estate/{estateId}/vend-analytics/chart (super admin overview) */
export const getSuperAdminEnergyConsumptionChart = createAsyncThunk(
  "super-admin-energy-consumption/getChart",
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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
