import { createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getResidentTypeBreakdown,
  getUserRoleBreakdown,
  getUserSummary,
  type ResidentTypeBreakdownData,
  type RoleBreakdownData,
  type UserSummaryData,
} from "./user-analytics";

type LoadStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface StaffUserAnalyticsState {
  residentTypeBreakdown: ResidentTypeBreakdownData | null;
  residentTypeBreakdownStatus: LoadStatus;
  residentTypeBreakdownError: string | null;

  userSummary: UserSummaryData | null;
  userSummaryStatus: LoadStatus;
  userSummaryError: string | null;

  roleBreakdown: RoleBreakdownData | null;
  roleBreakdownStatus: LoadStatus;
  roleBreakdownError: string | null;
}

const initialState: StaffUserAnalyticsState = {
  residentTypeBreakdown: null,
  residentTypeBreakdownStatus: "idle",
  residentTypeBreakdownError: null,

  userSummary: null,
  userSummaryStatus: "idle",
  userSummaryError: null,

  roleBreakdown: null,
  roleBreakdownStatus: "idle",
  roleBreakdownError: null,
};

const staffUserAnalyticsSlice = createSlice({
  name: "staffUserAnalytics",
  initialState,
  reducers: {
    clearStaffUserAnalytics: () => initialState,
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
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to fetch resident type breakdown";
      })

      .addCase(getUserSummary.pending, (state) => {
        state.userSummaryStatus = "isLoading";
        state.userSummaryError = null;
      })
      .addCase(getUserSummary.fulfilled, (state, action) => {
        state.userSummaryStatus = "succeeded";
        state.userSummary = action.payload?.data ?? null;
        state.userSummaryError = null;
      })
      .addCase(getUserSummary.rejected, (state, action) => {
        state.userSummaryStatus = "failed";
        state.userSummaryError =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          null;
      })

      .addCase(getUserRoleBreakdown.pending, (state) => {
        state.roleBreakdownStatus = "isLoading";
        state.roleBreakdownError = null;
      })
      .addCase(getUserRoleBreakdown.fulfilled, (state, action) => {
        state.roleBreakdownStatus = "succeeded";
        state.roleBreakdown = action.payload?.data ?? null;
        state.roleBreakdownError = null;
      })
      .addCase(getUserRoleBreakdown.rejected, (state, action) => {
        state.roleBreakdownStatus = "failed";
        state.roleBreakdownError =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          null;
      });
  },
});

export const { clearStaffUserAnalytics } = staffUserAnalyticsSlice.actions;

export const selectUserSummaryData = (state: RootState): UserSummaryData | null =>
  state.staffUserAnalytics.userSummary;

export const selectUserSummaryLoading = (state: RootState): boolean =>
  state.staffUserAnalytics.userSummaryStatus === "isLoading";

export const selectUserSummaryError = (state: RootState): string | null =>
  state.staffUserAnalytics.userSummaryError;

export const selectUserSummaryStatus = (
  state: RootState,
): StaffUserAnalyticsState["userSummaryStatus"] =>
  state.staffUserAnalytics.userSummaryStatus;

export const selectRoleBreakdownData = (
  state: RootState,
): RoleBreakdownData | null => state.staffUserAnalytics.roleBreakdown;

export const selectRoleBreakdownLoading = (state: RootState): boolean =>
  state.staffUserAnalytics.roleBreakdownStatus === "isLoading";

export const selectRoleBreakdownError = (state: RootState): string | null =>
  state.staffUserAnalytics.roleBreakdownError;

export const selectRoleBreakdownStatus = (
  state: RootState,
): StaffUserAnalyticsState["roleBreakdownStatus"] =>
  state.staffUserAnalytics.roleBreakdownStatus;

export default staffUserAnalyticsSlice.reducer;
