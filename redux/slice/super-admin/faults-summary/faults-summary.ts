import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { FaultsSummaryResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

/** GET /api/v1/analytics/operations/faults/summary */
export const getFaultsSummary = createAsyncThunk(
  "super-admin-faults-summary/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<FaultsSummaryResponse>(
        "/api/v1/analytics/operations/faults/summary",
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
