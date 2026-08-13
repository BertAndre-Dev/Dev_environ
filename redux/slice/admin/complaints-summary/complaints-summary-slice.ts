import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ComplaintsSummaryData } from "@/types/analytics";
import { getComplaintsSummary } from "./complaints-summary";

export interface ComplaintsSummaryState {
  data: ComplaintsSummaryData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ComplaintsSummaryState = {
  data: null,
  status: "idle",
  error: null,
};

const complaintsSummarySlice = createSlice({
  name: "adminComplaintsSummary",
  initialState,
  reducers: {
    clearComplaintsSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getComplaintsSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getComplaintsSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearComplaintsSummary } = complaintsSummarySlice.actions;

export const selectComplaintsSummaryData = (
  state: RootState,
): ComplaintsSummaryData | null => state.adminComplaintsSummary.data;

export const selectComplaintsSummaryLoading = (state: RootState): boolean =>
  state.adminComplaintsSummary.status === "isLoading";

export const selectComplaintsSummaryError = (state: RootState): string | null =>
  state.adminComplaintsSummary.error;

export default complaintsSummarySlice.reducer;
