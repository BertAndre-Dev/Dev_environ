import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  RevenueBySegmentData,
} from "@/types/analytics";
import { getRevenueBySegment } from "./revenue-by-segment";

export interface RevenueBySegmentState {
  data: RevenueBySegmentData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RevenueBySegmentState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const revenueBySegmentSlice = createSlice({
  name: "superAdminRevenueBySegment",
  initialState,
  reducers: {
    clearRevenueBySegment: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRevenueBySegment.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getRevenueBySegment.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getRevenueBySegment.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearRevenueBySegment } = revenueBySegmentSlice.actions;

export const selectRevenueBySegmentData = (state: RootState) =>
  state.superAdminRevenueBySegment.data;
export const selectRevenueBySegmentLoading = (state: RootState) =>
  state.superAdminRevenueBySegment.status === "isLoading";
export const selectRevenueBySegmentError = (state: RootState) =>
  state.superAdminRevenueBySegment.error;
export const selectRevenueBySegmentStatus = (state: RootState) =>
  state.superAdminRevenueBySegment.status;

export default revenueBySegmentSlice.reducer;
