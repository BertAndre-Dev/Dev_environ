import { createSlice } from "@reduxjs/toolkit";

import {
  getResidentTypeBreakdown,
  type ResidentTypeBreakdownData,
} from "./user-analytics";

export interface AdminUserAnalyticsState {
  residentTypeBreakdown: ResidentTypeBreakdownData | null;
  residentTypeBreakdownStatus: "idle" | "isLoading" | "succeeded" | "failed";
  residentTypeBreakdownError: string | null;
}

const initialState: AdminUserAnalyticsState = {
  residentTypeBreakdown: null,
  residentTypeBreakdownStatus: "idle",
  residentTypeBreakdownError: null,
};

const adminUserAnalyticsSlice = createSlice({
  name: "adminUserAnalytics",
  initialState,
  reducers: {
    clearAdminUserAnalytics: (state) => {
      state.residentTypeBreakdown = null;
      state.residentTypeBreakdownStatus = "idle";
      state.residentTypeBreakdownError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getResidentTypeBreakdown.pending, (state) => {
        state.residentTypeBreakdownStatus = "isLoading";
        state.residentTypeBreakdownError = null;
      })
      .addCase(getResidentTypeBreakdown.fulfilled, (state, action) => {
        state.residentTypeBreakdownStatus = "succeeded";
        state.residentTypeBreakdown = action.payload?.data ?? null;
        state.residentTypeBreakdownError = null;
      })
      .addCase(getResidentTypeBreakdown.rejected, (state, action) => {
        state.residentTypeBreakdownStatus = "failed";
        state.residentTypeBreakdownError =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch resident type breakdown";
      });
  },
});

export const { clearAdminUserAnalytics } = adminUserAnalyticsSlice.actions;
export default adminUserAnalyticsSlice.reducer;
