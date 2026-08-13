import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { UserSummaryData } from "@/redux/slice/admin/user-analytics/user-analytics";
import { getEstateAdminUserSummary } from "./user-analytics";

type LoadStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminUserAnalyticsState {
  userSummary: UserSummaryData | null;
  userSummaryStatus: LoadStatus;
  userSummaryError: string | null;
}

const initialState: EstateAdminUserAnalyticsState = {
  userSummary: null,
  userSummaryStatus: "idle",
  userSummaryError: null,
};

const estateAdminUserAnalyticsSlice = createSlice({
  name: "estateAdminUserAnalytics",
  initialState,
  reducers: {
    clearEstateAdminUserAnalytics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminUserSummary.pending, (state) => {
        state.userSummaryStatus = "isLoading";
        state.userSummaryError = null;
      })
      .addCase(getEstateAdminUserSummary.fulfilled, (state, action) => {
        state.userSummaryStatus = "succeeded";
        state.userSummary = action.payload?.data ?? null;
        state.userSummaryError = null;
      })
      .addCase(getEstateAdminUserSummary.rejected, (state, action) => {
        state.userSummaryStatus = "failed";
        state.userSummaryError =
          getApiErrorMessage(action.payload) ?? action.error.message ?? null;
      });
  },
});

export const { clearEstateAdminUserAnalytics } =
  estateAdminUserAnalyticsSlice.actions;

export const selectEstateAdminUserSummaryData = (
  state: RootState,
): UserSummaryData | null => state.estateAdminUserAnalytics.userSummary;

export const selectEstateAdminUserSummaryLoading = (state: RootState): boolean =>
  state.estateAdminUserAnalytics.userSummaryStatus === "isLoading";

export const selectEstateAdminUserSummaryError = (
  state: RootState,
): string | null => state.estateAdminUserAnalytics.userSummaryError;

export const selectEstateAdminUserSummaryStatus = (
  state: RootState,
): EstateAdminUserAnalyticsState["userSummaryStatus"] =>
  state.estateAdminUserAnalytics.userSummaryStatus;

export default estateAdminUserAnalyticsSlice.reducer;
