import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { BillsSummaryData } from "@/types/analytics";
import { getBillsSummary } from "./bills-summary";

export interface BillsSummaryState {
  data: BillsSummaryData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: BillsSummaryState = {
  data: null,
  status: "idle",
  error: null,
};

const billsSummarySlice = createSlice({
  name: "staffBillsSummary",
  initialState,
  reducers: {
    clearBillsSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBillsSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getBillsSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getBillsSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearBillsSummary } = billsSummarySlice.actions;

export const selectBillsSummaryData = (state: RootState): BillsSummaryData | null =>
  state.staffBillsSummary.data;

export const selectBillsSummaryLoading = (state: RootState): boolean =>
  state.staffBillsSummary.status === "isLoading";

export const selectBillsSummaryError = (state: RootState): string | null =>
  state.staffBillsSummary.error;

export const selectBillsSummaryStatus = (
  state: RootState,
): BillsSummaryState["status"] => state.staffBillsSummary.status;

export default billsSummarySlice.reducer;
