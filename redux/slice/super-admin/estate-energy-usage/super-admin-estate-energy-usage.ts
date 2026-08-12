import { createAsyncThunk } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  fetchEstateEnergyUsageJob,
  type EstateEnergyUsageJobMeta,
  type EstateEnergyUsageJobResult,
} from "@/lib/fetch-estate-energy-usage-job";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";

export type SuperAdminEstateEnergyUsageJobMeta = EstateEnergyUsageJobMeta;
export type SuperAdminEstateEnergyUsageResult = EstateEnergyUsageJobResult;

/**
 * GET /api/v1/meters/estate/{estateId}/hes/usage/jobs
 * Polls that same URL until completed is true.
 */
export const getSuperAdminEstateEnergyUsage = createAsyncThunk(
  "super-admin-estate-energy-usage/getUsage",
  async (
    {
      estateId,
      range = "weekly",
      year,
      month,
      refresh,
    }: {
      estateId: string;
      range?: EstateEnergyUsageRange;
      year?: number;
      month?: number;
      refresh?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      return await fetchEstateEnergyUsageJob({
        estateId,
        range,
        year,
        month,
        refresh,
      });
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
