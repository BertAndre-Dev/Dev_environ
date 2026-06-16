import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ExpenseChartPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type ExpenseChartPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
};

export type ExpenseChartSummary = {
  total: number;
  totalEntries: number;
  totalDataPoints: number;
};

export type ExpenseChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    period: ExpenseChartPeriod | string;
    groupBy?: string;
    headId?: string | null;
    chartData: ExpenseChartPoint[];
    summary?: ExpenseChartSummary;
  };
};

export type FetchExpenseChartParams = {
  estateId: string;
  period?: ExpenseChartPeriod;
  startDate?: string;
  endDate?: string;
  headId?: string;
};

export const fetchExpenseChart = createAsyncThunk(
  "estate-admin-expense-chart/fetch",
  async (params: FetchExpenseChartParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<ExpenseChartResponse>(
        "/api/v1/financial-report/expense-chart",
        { params },
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch expense chart data.",
      });
    }
  },
);
