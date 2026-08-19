import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { RevenueSummaryResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/finance/revenue/summary */
export const getRevenueSummary = createAsyncThunk(
  "super-admin-revenue-summary/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<RevenueSummaryResponse>(
        "/api/v1/analytics/finance/revenue/summary",
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
