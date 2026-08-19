import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  RevenueSummaryData,
} from "@/types/analytics";
import { getRevenueSummary } from "./revenue-summary";

export interface RevenueSummaryState {
  data: RevenueSummaryData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RevenueSummaryState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const revenueSummarySlice = createSlice({
  name: "superAdminRevenueSummary",
  initialState,
  reducers: {
    clearRevenueSummary: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRevenueSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getRevenueSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getRevenueSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearRevenueSummary } = revenueSummarySlice.actions;

export const selectRevenueSummaryData = (state: RootState) =>
  state.superAdminRevenueSummary.data;
export const selectRevenueSummaryLoading = (state: RootState) =>
  state.superAdminRevenueSummary.status === "isLoading";
export const selectRevenueSummaryError = (state: RootState) =>
  state.superAdminRevenueSummary.error;
export const selectRevenueSummaryStatus = (state: RootState) =>
  state.superAdminRevenueSummary.status;

export default revenueSummarySlice.reducer;
