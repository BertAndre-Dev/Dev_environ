import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchCompanyRevenueChart,
  type CompanyRevenueChartPoint,
  type CompanyRevenueChartResponse,
  type CompanyRevenueChartSummary,
} from "./company-revenue-chart";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyRevenueChartState {
  fetchState: AsyncState;
  chartData: CompanyRevenueChartPoint[];
  summary: CompanyRevenueChartSummary | null;
  meta: CompanyRevenueChartResponse["data"] | null;
  error: string | null;
}

const initialState: CompanyRevenueChartState = {
  fetchState: "idle",
  chartData: [],
  summary: null,
  meta: null,
  error: null,
};

const companyRevenueChartSlice = createSlice({
  name: "companyRevenueChart",
  initialState,
  reducers: {
    resetCompanyRevenueChartError: (state) => {
      state.error = null;
    },
    clearCompanyRevenueChart: (state) => {
      state.fetchState = "idle";
      state.chartData = [];
      state.summary = null;
      state.meta = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyRevenueChart.pending, (state) => {
        state.fetchState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyRevenueChart.fulfilled, (state, action) => {
        state.fetchState = "succeeded";
        const data = action.payload?.data ?? null;
        state.meta = data;
        state.chartData = data?.chartData ?? [];
        state.summary = data?.summary ?? null;
      })
      .addCase(fetchCompanyRevenueChart.rejected, (state, action) => {
        state.fetchState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch revenue chart data.";
      });
  },
});

export const { resetCompanyRevenueChartError, clearCompanyRevenueChart } =
  companyRevenueChartSlice.actions;
export default companyRevenueChartSlice.reducer;

export const selectCompanyRevenueChart = (state: RootState) =>
  state.companyRevenueChart;

export const selectCompanyRevenueChartData = (state: RootState) =>
  selectCompanyRevenueChart(state)?.chartData ?? [];

export const selectCompanyRevenueChartSummary = (state: RootState) =>
  selectCompanyRevenueChart(state)?.summary ?? null;

export const selectCompanyRevenueChartLoading = (state: RootState) =>
  selectCompanyRevenueChart(state)?.fetchState === "isLoading";

export const selectCompanyRevenueChartError = (state: RootState) =>
  selectCompanyRevenueChart(state)?.error ?? null;
