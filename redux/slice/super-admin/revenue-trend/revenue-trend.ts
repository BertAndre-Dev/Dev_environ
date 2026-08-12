import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
