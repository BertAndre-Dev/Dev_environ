import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchRevenueChart,
  type RevenueChartPoint,
  type RevenueChartResponse,
  type RevenueChartSummary,
} from "./revenue-chart";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminRevenueChartState {
  fetchState: AsyncState;
  chartData: RevenueChartPoint[];
  summary: RevenueChartSummary | null;
  meta: RevenueChartResponse["data"] | null;
  error: string | null;
}

const initialState: EstateAdminRevenueChartState = {
  fetchState: "idle",
  chartData: [],
  summary: null,
  meta: null,
  error: null,
};

const slice = createSlice({
  name: "estateAdminRevenueChart",
  initialState,
  reducers: {
    resetRevenueChartError: (state) => {
      state.error = null;
    },
    clearRevenueChart: (state) => {
      state.fetchState = "idle";
      state.chartData = [];
      state.summary = null;
      state.meta = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenueChart.pending, (state) => {
        state.fetchState = "isLoading";
        state.error = null;
      })
      .addCase(fetchRevenueChart.fulfilled, (state, action) => {
        state.fetchState = "succeeded";
        const data = action.payload?.data ?? null;
        state.meta = data;
        state.chartData = data?.chartData ?? [];
        state.summary = data?.summary ?? null;
      })
      .addCase(fetchRevenueChart.rejected, (state, action: any) => {
        state.fetchState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch revenue chart data.";
      });
  },
});

export const { resetRevenueChartError, clearRevenueChart } = slice.actions;
export default slice.reducer;

export const selectEstateAdminRevenueChart = (state: RootState) =>
  state.estateAdminRevenueChart;

export const selectRevenueChartData = (state: RootState) =>
  selectEstateAdminRevenueChart(state)?.chartData ?? [];

export const selectRevenueChartSummary = (state: RootState) =>
  selectEstateAdminRevenueChart(state)?.summary ?? null;

export const selectRevenueChartLoading = (state: RootState) =>
  selectEstateAdminRevenueChart(state)?.fetchState === "isLoading";

export const selectRevenueChartError = (state: RootState) =>
  selectEstateAdminRevenueChart(state)?.error ?? null;
