import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  PlatformFeeAnalytics,
  PlatformFeePagination,
} from "@/types/analytics";
import { getPlatformFeeAnalytics } from "./platform-fees";

export interface PlatformFeesState {
  data: PlatformFeeAnalytics | null;
  pagination: PlatformFeePagination | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PlatformFeesState = {
  data: null,
  pagination: null,
  status: "idle",
  error: null,
};

const platformFeesSlice = createSlice({
  name: "superAdminPlatformFees",
  initialState,
  reducers: {
    clearPlatformFees: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPlatformFeeAnalytics.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getPlatformFeeAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.pagination = action.payload?.pagination ?? null;
        state.error = null;
      })
      .addCase(getPlatformFeeAnalytics.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearPlatformFees } = platformFeesSlice.actions;

export const selectPlatformFeeAnalytics = (
  state: RootState,
): PlatformFeeAnalytics | null => state.superAdminPlatformFees.data;

export const selectPlatformFeePagination = (
  state: RootState,
): PlatformFeePagination | null => state.superAdminPlatformFees.pagination;

export const selectPlatformFeeLoading = (state: RootState): boolean =>
  state.superAdminPlatformFees.status === "isLoading";

export const selectPlatformFeeError = (state: RootState): string | null =>
  state.superAdminPlatformFees.error;

export const selectPlatformFeeStatus = (
  state: RootState,
): PlatformFeesState["status"] => state.superAdminPlatformFees.status;

export default platformFeesSlice.reducer;
