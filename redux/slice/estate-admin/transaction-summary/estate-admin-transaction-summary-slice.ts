import { createSlice } from "@reduxjs/toolkit";
import {
  EMPTY_TRANSACTION_SUMMARY,
  type TransactionSummaryData,
} from "@/lib/transaction-summary-chart";
import { getEstateAdminTransactionSummary } from "./estate-admin-transaction-summary";

export interface EstateAdminTransactionSummaryState {
  summary: TransactionSummaryData;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EstateAdminTransactionSummaryState = {
  summary: EMPTY_TRANSACTION_SUMMARY,
  status: "idle",
  error: null,
};

const estateAdminTransactionSummarySlice = createSlice({
  name: "estateAdminTransactionSummary",
  initialState,
  reducers: {
    clearEstateAdminTransactionSummary: (state) => {
      state.summary = EMPTY_TRANSACTION_SUMMARY;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminTransactionSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminTransactionSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload ?? EMPTY_TRANSACTION_SUMMARY;
        state.error = null;
      })
      .addCase(getEstateAdminTransactionSummary.rejected, (state, action) => {
        state.status = "failed";
        state.summary = EMPTY_TRANSACTION_SUMMARY;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch transaction summary";
      });
  },
});

export const { clearEstateAdminTransactionSummary } =
  estateAdminTransactionSummarySlice.actions;
export default estateAdminTransactionSummarySlice.reducer;
