import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsPeriodRange,
  AnalyticsScope,
  RechargeBehaviorBucket,
  RechargeBehaviorPoint,
} from "@/types/analytics";
import { getRechargeBehavior } from "./recharge-behavior";

export interface RechargeBehaviorState {
  bucket: RechargeBehaviorBucket;
  series: RechargeBehaviorPoint[];
  period: AnalyticsPeriodRange | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RechargeBehaviorState = {
  bucket: "daily",
  series: [],
  period: null,
  scope: null,
  status: "idle",
  error: null,
};

const rechargeBehaviorSlice = createSlice({
  name: "superAdminRechargeBehavior",
  initialState,
  reducers: {
    setRechargeBehaviorBucket: (
      state,
      action: PayloadAction<RechargeBehaviorBucket>,
    ) => {
      state.bucket = action.payload;
    },
    clearRechargeBehavior: (state) => {
      state.series = [];
      state.period = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
      state.bucket = "daily";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRechargeBehavior.pending, (state, action) => {
        if (action.meta.arg.bucket !== state.bucket) return;
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getRechargeBehavior.fulfilled, (state, action) => {
        if (action.meta.arg.bucket !== state.bucket) return;
        state.status = "succeeded";
        state.series = action.payload?.data?.series ?? [];
        state.period = action.payload?.data?.period ?? null;
        state.scope = action.payload?.scope ?? null;
        if (action.payload?.data?.bucket) {
          state.bucket = action.payload.data.bucket;
        }
        state.error = null;
      })
      .addCase(getRechargeBehavior.rejected, (state, action) => {
        if (action.meta.arg.bucket !== state.bucket) return;
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { setRechargeBehaviorBucket, clearRechargeBehavior } =
  rechargeBehaviorSlice.actions;

export const selectRechargeBehaviorSeries = (
  state: RootState,
): RechargeBehaviorPoint[] => state.superAdminRechargeBehavior.series;
export const selectRechargeBehaviorBucket = (
  state: RootState,
): RechargeBehaviorBucket => state.superAdminRechargeBehavior.bucket;
export const selectRechargeBehaviorLoading = (state: RootState): boolean =>
  state.superAdminRechargeBehavior.status === "isLoading";
export const selectRechargeBehaviorError = (state: RootState): string | null =>
  state.superAdminRechargeBehavior.error;
export const selectRechargeBehaviorPeriod = (
  state: RootState,
): AnalyticsPeriodRange | null => state.superAdminRechargeBehavior.period;
export const selectRechargeBehaviorScope = (
  state: RootState,
): AnalyticsScope | null => state.superAdminRechargeBehavior.scope;
export const selectRechargeBehaviorStatus = (
  state: RootState,
): RechargeBehaviorState["status"] => state.superAdminRechargeBehavior.status;

export default rechargeBehaviorSlice.reducer;
