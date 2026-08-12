import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export type CompanyExpenseChartPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type CompanyExpenseChartPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
};

export type CompanyExpenseChartSummary = {
  total: number;
  totalEntries: number;
  totalDataPoints: number;
};

export type CompanyExpenseChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    period: CompanyExpenseChartPeriod | string;
    groupBy?: string;
    headId?: string | null;
    chartData: CompanyExpenseChartPoint[];
    summary?: CompanyExpenseChartSummary;
  };
};

export type FetchCompanyExpenseChartParams = {
  estateId: string;
  period?: CompanyExpenseChartPeriod;
  startDate?: string;
  endDate?: string;
  headId?: string;
};

export const fetchCompanyExpenseChart = createAsyncThunk(
  "company-expense-chart/fetch",
  async (params: FetchCompanyExpenseChartParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<CompanyExpenseChartResponse>(
        "/api/v1/financial-report/expense-chart",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
