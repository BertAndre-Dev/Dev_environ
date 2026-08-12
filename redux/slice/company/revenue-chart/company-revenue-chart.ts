import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export type CompanyRevenueChartPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export type CompanyRevenueChartByHead = {
  headName: string;
  value: number;
};

export type CompanyRevenueChartPoint = {
  key: string;
  label: string;
  value: number;
  count: number;
  vending: number;
  bills: number;
  byHead: CompanyRevenueChartByHead[];
};

export type CompanyRevenueChartSummary = {
  total: number;
  vending: number;
  bills: number;
  byHead: CompanyRevenueChartByHead[];
  totalTransactions: number;
  totalDataPoints: number;
};

export type CompanyRevenueChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    period: CompanyRevenueChartPeriod | string;
    groupBy?: string;
    headId?: string | null;
    chartData: CompanyRevenueChartPoint[];
    summary?: CompanyRevenueChartSummary;
  };
};

export type FetchCompanyRevenueChartParams = {
  estateId: string;
  period?: CompanyRevenueChartPeriod;
  startDate?: string;
  endDate?: string;
  headId?: string;
};

export const fetchCompanyRevenueChart = createAsyncThunk(
  "company-revenue-chart/fetch",
  async (params: FetchCompanyRevenueChartParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<CompanyRevenueChartResponse>(
        "/api/v1/financial-report/revenue-chart",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
