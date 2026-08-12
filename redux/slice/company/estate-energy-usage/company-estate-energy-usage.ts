import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiErrorRejectValue } from "@/lib/api-error";
import {
  fetchEstateEnergyUsageJob,
  type EstateEnergyUsageJobMeta,
  type EstateEnergyUsageJobResult,
} from "@/lib/fetch-estate-energy-usage-job";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";

export type { EstateEnergyUsageJobMeta };
export type EstateEnergyUsageResult = EstateEnergyUsageJobResult;

/**
 * GET /api/v1/meters/estate/{estateId}/hes/usage/jobs
 * Polls that same URL until completed is true.
 */
export const getCompanyEstateEnergyUsage = createAsyncThunk(
  "company-estate-energy-usage/getUsage",
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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
