import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

import {
  fetchExpenseChart,
  type ExpenseChartPoint,
  type ExpenseChartResponse,
  type ExpenseChartSummary,
} from "./expense-chart";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminExpenseChartState {
  fetchState: AsyncState;
  chartData: ExpenseChartPoint[];
  summary: ExpenseChartSummary | null;
  meta: ExpenseChartResponse["data"] | null;
  error: string | null;
}

const initialState: EstateAdminExpenseChartState = {
  fetchState: "idle",
  chartData: [],
  summary: null,
  meta: null,
  error: null,
};

const slice = createSlice({
  name: "estateAdminExpenseChart",
  initialState,
  reducers: {
    resetExpenseChartError: (state) => {
      state.error = null;
    },
    clearExpenseChart: (state) => {
      state.fetchState = "idle";
      state.chartData = [];
      state.summary = null;
      state.meta = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenseChart.pending, (state) => {
        state.fetchState = "isLoading";
        state.error = null;
      })
      .addCase(fetchExpenseChart.fulfilled, (state, action) => {
        state.fetchState = "succeeded";
        const data = action.payload?.data ?? null;
        state.meta = data;
        state.chartData = data?.chartData ?? [];
        state.summary = data?.summary ?? null;
      })
      .addCase(fetchExpenseChart.rejected, (state, action: any) => {
        state.fetchState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch expense chart data.";
      });
  },
});

export const { resetExpenseChartError, clearExpenseChart } = slice.actions;
export default slice.reducer;

export const selectEstateAdminExpenseChart = (state: RootState) =>
  state.estateAdminExpenseChart;

export const selectExpenseChartData = (state: RootState) =>
  selectEstateAdminExpenseChart(state)?.chartData ?? [];

export const selectExpenseChartSummary = (state: RootState) =>
  selectEstateAdminExpenseChart(state)?.summary ?? null;

export const selectExpenseChartLoading = (state: RootState) =>
  selectEstateAdminExpenseChart(state)?.fetchState === "isLoading";

export const selectExpenseChartError = (state: RootState) =>
  selectEstateAdminExpenseChart(state)?.error ?? null;
