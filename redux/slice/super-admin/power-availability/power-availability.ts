import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { PowerAvailabilityResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

/** GET /api/v1/analytics/operations/meters/power-availability */
export const getPowerAvailability = createAsyncThunk(
  "super-admin-power-availability/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<PowerAvailabilityResponse>(
        "/api/v1/analytics/operations/meters/power-availability",
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
