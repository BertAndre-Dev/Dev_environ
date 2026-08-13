import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { TransactionAnalyticsResponse } from "@/types/analytics";

export type {
  ChargeAnalytics,
  ChargeAnalyticsSummary,
  ChargeBreakdownItem,
  RecentCharge,
  StatusBreakdown,
  TopUser,
  TransactionAnalyticsDashboard,
  TransactionAnalyticsResponse,
  TransactionMetrics,
  TrendPoint,
} from "@/types/analytics";

/** GET /api/v1/analytics/transactions/dashboard */
export const getTransactionAnalyticsDashboard = createAsyncThunk(
  "estate-admin-transaction-analytics/getDashboard",
  async (
    {
      estateId,
      startDate,
      endDate,
    }: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string> = { estateId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axiosInstance.get<TransactionAnalyticsResponse>(
        "/api/v1/analytics/transactions/dashboard",
        { params },
      );
      return res.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch transaction analytics.",
      });
    }
  },
);
