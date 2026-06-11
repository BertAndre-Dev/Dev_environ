import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type RevenueChartPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type RevenueChartByHead = {
  headName: string;
  value: number;
};

export type RevenueChartPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
  vending: number;
  bills: number;
  byHead: RevenueChartByHead[];
};

export type RevenueChartSummary = {
  total: number;
  vending: number;
  bills: number;
  byHead: RevenueChartByHead[];
  totalTransactions: number;
  totalDataPoints: number;
};

export type RevenueChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    period: RevenueChartPeriod | string;
    groupBy?: string;
    headId?: string | null;
    chartData: RevenueChartPoint[];
    summary?: RevenueChartSummary;
  };
};

export type FetchRevenueChartParams = {
  estateId: string;
  period?: RevenueChartPeriod;
  startDate?: string;
  endDate?: string;
  headId?: string;
};

export const fetchRevenueChart = createAsyncThunk(
  "estate-admin-revenue-chart/fetch",
  async (params: FetchRevenueChartParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<RevenueChartResponse>(
        "/api/v1/financial-report/revenue-chart",
        { params },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch revenue chart data.",
      });
    }
  },
);
