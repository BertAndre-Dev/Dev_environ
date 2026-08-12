import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { FinancialReportData } from "@/lib/financial-report-utils";
import { apiErrorRejectValue } from "@/lib/api-error";

export type CompanyAnalyticsChartPoint = {
  date: string;
  vending: number;
  bills: number;
  revenue: number;
  expenses: number;
};

export type CompanyFinancialReportGenerateResponse = {
  success?: boolean;
  message?: string;
  data?: FinancialReportData;
};

export type CompanyFinancialReportAnalyticsChartResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reportPeriod?: { startDate: string; endDate: string };
    chartData: CompanyAnalyticsChartPoint[];
    summary?: { totalDataPoints?: number; dateRange?: string };
  };
};

export const fetchCompanyFinancialReportGenerate = createAsyncThunk(
  "company-financial-report/fetchGenerate",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<CompanyFinancialReportGenerateResponse>(
        "/api/v1/financial-report/generate",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const fetchCompanyFinancialReportAnalyticsChart = createAsyncThunk(
  "company-financial-report/fetchAnalyticsChart",
  async (
    params: { estateId: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      const res =
        await axiosInstance.get<CompanyFinancialReportAnalyticsChartResponse>(
          "/api/v1/financial-report/analytics-chart",
          { params },
        );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
