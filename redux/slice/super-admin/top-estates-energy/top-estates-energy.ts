import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { TopEstatesEnergyResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/vending/top-estates?limit= */
export const getTopEstatesEnergy = createAsyncThunk(
  "super-admin-top-estates-energy/get",
  async (
    params: { limit?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const limit = params?.limit;
      const res = await axiosInstance.get<TopEstatesEnergyResponse>(
        "/api/v1/analytics/commercial/vending/top-estates",
        { params: limit != null ? { limit } : undefined },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
