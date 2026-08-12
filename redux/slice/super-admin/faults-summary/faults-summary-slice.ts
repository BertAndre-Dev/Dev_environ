import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { AnalyticsScope, FaultsSummaryData } from "@/types/analytics";
import { getFaultsSummary } from "./faults-summary";
import { getApiErrorMessage } from "@/lib/api-error";

export interface FaultsSummaryState {
  data: FaultsSummaryData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: FaultsSummaryState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const faultsSummarySlice = createSlice({
  name: "superAdminFaultsSummary",
  initialState,
  reducers: {
    clearFaultsSummary: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFaultsSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getFaultsSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getFaultsSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearFaultsSummary } = faultsSummarySlice.actions;

export const selectFaultsSummaryData = (state: RootState) =>
  state.superAdminFaultsSummary.data;
export const selectFaultsSummaryLoading = (state: RootState) =>
  state.superAdminFaultsSummary.status === "isLoading";
export const selectFaultsSummaryError = (state: RootState) =>
  state.superAdminFaultsSummary.error;
export const selectFaultsSummaryStatus = (state: RootState) =>
  state.superAdminFaultsSummary.status;
export const selectFaultsSummaryScope = (state: RootState) =>
  state.superAdminFaultsSummary.scope;

export default faultsSummarySlice.reducer;
