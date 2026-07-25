import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type {
  RevenueTrendGranularity,
  RevenueTrendResponse,
} from "@/types/analytics";

/** GET /api/v1/analytics/finance/revenue/trend?granularity=week|month */
export const getRevenueTrend = createAsyncThunk(
  "super-admin-revenue-trend/get",
  async (
    { granularity }: { granularity: RevenueTrendGranularity },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<RevenueTrendResponse>(
        "/api/v1/analytics/finance/revenue/trend",
        { params: { granularity } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch revenue trend.",
      });
    }
  },
);
