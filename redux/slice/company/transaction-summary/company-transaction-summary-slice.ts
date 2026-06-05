import { createSlice } from "@reduxjs/toolkit";
import {
  EMPTY_TRANSACTION_SUMMARY,
  type TransactionSummaryData,
} from "@/lib/transaction-summary-chart";
import { getCompanyTransactionSummary } from "./company-transaction-summary";

export interface CompanyTransactionSummaryState {
  summary: TransactionSummaryData;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CompanyTransactionSummaryState = {
  summary: EMPTY_TRANSACTION_SUMMARY,
  status: "idle",
  error: null,
};

const companyTransactionSummarySlice = createSlice({
  name: "companyTransactionSummary",
  initialState,
  reducers: {
    clearCompanyTransactionSummary: (state) => {
      state.summary = EMPTY_TRANSACTION_SUMMARY;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyTransactionSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyTransactionSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload ?? EMPTY_TRANSACTION_SUMMARY;
        state.error = null;
      })
      .addCase(getCompanyTransactionSummary.rejected, (state, action) => {
        state.status = "failed";
        state.summary = EMPTY_TRANSACTION_SUMMARY;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch transaction summary";
      });
  },
});

export const { clearCompanyTransactionSummary } =
  companyTransactionSummarySlice.actions;
export default companyTransactionSummarySlice.reducer;
