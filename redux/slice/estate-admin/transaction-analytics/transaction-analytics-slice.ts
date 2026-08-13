import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { TransactionAnalyticsDashboard } from "@/types/analytics";
import { getTransactionAnalyticsDashboard } from "./transaction-analytics";

export interface TransactionAnalyticsState {
  dashboard: TransactionAnalyticsDashboard | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TransactionAnalyticsState = {
  dashboard: null,
  status: "idle",
  error: null,
};

const transactionAnalyticsSlice = createSlice({
  name: "estateAdminTransactionAnalytics",
  initialState,
  reducers: {
    clearTransactionAnalytics: (state) => {
      state.dashboard = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTransactionAnalyticsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getTransactionAnalyticsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.dashboard = action.payload ?? null;
        state.error = null;
      })
      .addCase(getTransactionAnalyticsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch transaction analytics";
      });
  },
});

export const { clearTransactionAnalytics } = transactionAnalyticsSlice.actions;

export const selectTransactionAnalyticsDashboard = (
  state: RootState,
): TransactionAnalyticsDashboard | null =>
  state.estateAdminTransactionAnalytics.dashboard;

export const selectTransactionAnalyticsStatus = (
  state: RootState,
): TransactionAnalyticsState["status"] =>
  state.estateAdminTransactionAnalytics.status;

export const selectTransactionAnalyticsError = (
  state: RootState,
): string | null => state.estateAdminTransactionAnalytics.error;

export default transactionAnalyticsSlice.reducer;
