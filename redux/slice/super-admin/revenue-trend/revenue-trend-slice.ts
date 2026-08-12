import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  RevenuePoint,
  RevenueTrendGranularity,
  RevenueTrendScope,
} from "@/types/analytics";
import { getRevenueTrend } from "./revenue-trend";

export interface RevenueTrendState {
  granularity: RevenueTrendGranularity;
  series: RevenuePoint[];
  scope: RevenueTrendScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RevenueTrendState = {
  granularity: "week",
  series: [],
  scope: null,
  status: "idle",
  error: null,
};

const revenueTrendSlice = createSlice({
  name: "superAdminRevenueTrend",
  initialState,
  reducers: {
    setRevenueTrendGranularity: (
      state,
      action: PayloadAction<RevenueTrendGranularity>,
    ) => {
      state.granularity = action.payload;
    },
    clearRevenueTrend: (state) => {
      state.series = [];
      state.scope = null;
      state.status = "idle";
      state.error = null;
      state.granularity = "week";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRevenueTrend.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getRevenueTrend.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.series = action.payload?.data?.series ?? [];
        state.scope = action.payload?.scope ?? null;
        if (action.payload?.data?.granularity) {
          state.granularity = action.payload.data.granularity;
        }
        state.error = null;
      })
      .addCase(getRevenueTrend.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { setRevenueTrendGranularity, clearRevenueTrend } =
  revenueTrendSlice.actions;

export const selectRevenueTrendSeries = (state: RootState): RevenuePoint[] =>
  state.superAdminRevenueTrend.series;
export const selectRevenueTrendGranularity = (
  state: RootState,
): RevenueTrendGranularity => state.superAdminRevenueTrend.granularity;
export const selectRevenueTrendLoading = (state: RootState): boolean =>
  state.superAdminRevenueTrend.status === "isLoading";
export const selectRevenueTrendError = (state: RootState): string | null =>
  state.superAdminRevenueTrend.error;
export const selectRevenueTrendStatus = (
  state: RootState,
): RevenueTrendState["status"] => state.superAdminRevenueTrend.status;
export const selectRevenueTrendScope = (
  state: RootState,
): RevenueTrendScope | null => state.superAdminRevenueTrend.scope;

export default revenueTrendSlice.reducer;
