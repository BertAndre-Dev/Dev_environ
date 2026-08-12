import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { TopEstatesEnergyResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
