import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";

import {
  fetchCompanyExpenseChart,
  type CompanyExpenseChartPoint,
  type CompanyExpenseChartResponse,
  type CompanyExpenseChartSummary,
} from "./company-expense-chart";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyExpenseChartState {
  fetchState: AsyncState;
  chartData: CompanyExpenseChartPoint[];
  summary: CompanyExpenseChartSummary | null;
  meta: CompanyExpenseChartResponse["data"] | null;
  error: string | null;
}

const initialState: CompanyExpenseChartState = {
  fetchState: "idle",
  chartData: [],
  summary: null,
  meta: null,
  error: null,
};

const companyExpenseChartSlice = createSlice({
  name: "companyExpenseChart",
  initialState,
  reducers: {
    resetCompanyExpenseChartError: (state) => {
      state.error = null;
    },
    clearCompanyExpenseChart: (state) => {
      state.fetchState = "idle";
      state.chartData = [];
      state.summary = null;
      state.meta = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyExpenseChart.pending, (state) => {
        state.fetchState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyExpenseChart.fulfilled, (state, action) => {
        state.fetchState = "succeeded";
        const data = action.payload?.data ?? null;
        state.meta = data;
        state.chartData = data?.chartData ?? [];
        state.summary = data?.summary ?? null;
      })
      .addCase(fetchCompanyExpenseChart.rejected, (state, action) => {
        state.fetchState = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { resetCompanyExpenseChartError, clearCompanyExpenseChart } =
  companyExpenseChartSlice.actions;
export default companyExpenseChartSlice.reducer;

export const selectCompanyExpenseChart = (state: RootState) =>
  state.companyExpenseChart;

export const selectCompanyExpenseChartData = (state: RootState) =>
  selectCompanyExpenseChart(state)?.chartData ?? [];

export const selectCompanyExpenseChartSummary = (state: RootState) =>
  selectCompanyExpenseChart(state)?.summary ?? null;

export const selectCompanyExpenseChartLoading = (state: RootState) =>
  selectCompanyExpenseChart(state)?.fetchState === "isLoading";

export const selectCompanyExpenseChartError = (state: RootState) =>
  selectCompanyExpenseChart(state)?.error ?? null;
