import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { FaultsSummaryResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
