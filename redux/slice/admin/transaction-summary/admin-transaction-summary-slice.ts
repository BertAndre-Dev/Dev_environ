import { createSlice } from "@reduxjs/toolkit";
import {
  EMPTY_TRANSACTION_SUMMARY,
  type TransactionSummaryData,
} from "@/lib/transaction-summary-chart";
import { getAdminTransactionSummary } from "./admin-transaction-summary";

export interface AdminTransactionSummaryState {
  summary: TransactionSummaryData;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminTransactionSummaryState = {
  summary: EMPTY_TRANSACTION_SUMMARY,
  status: "idle",
  error: null,
};

const adminTransactionSummarySlice = createSlice({
  name: "adminTransactionSummary",
  initialState,
  reducers: {
    clearAdminTransactionSummary: (state) => {
      state.summary = EMPTY_TRANSACTION_SUMMARY;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminTransactionSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getAdminTransactionSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload ?? EMPTY_TRANSACTION_SUMMARY;
        state.error = null;
      })
      .addCase(getAdminTransactionSummary.rejected, (state, action) => {
        state.status = "failed";
        state.summary = EMPTY_TRANSACTION_SUMMARY;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch transaction summary";
      });
  },
});

export const { clearAdminTransactionSummary } =
  adminTransactionSummarySlice.actions;
export default adminTransactionSummarySlice.reducer;
