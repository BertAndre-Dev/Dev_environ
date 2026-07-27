import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  AnalyticsPeriodRange,
  AnalyticsScope,
  PaymentChannelEntry,
} from "@/types/analytics";
import { getPaymentChannels } from "./payment-channels";

export interface PaymentChannelsState {
  series: PaymentChannelEntry[];
  period: AnalyticsPeriodRange | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PaymentChannelsState = {
  series: [],
  period: null,
  scope: null,
  status: "idle",
  error: null,
};

const paymentChannelsSlice = createSlice({
  name: "superAdminPaymentChannels",
  initialState,
  reducers: {
    clearPaymentChannels: (state) => {
      state.series = [];
      state.period = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPaymentChannels.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getPaymentChannels.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.series = action.payload?.data ?? [];
        state.period = action.payload?.period ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getPaymentChannels.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch payment channels";
      });
  },
});

export const { clearPaymentChannels } = paymentChannelsSlice.actions;

export const selectPaymentChannelsSeries = (
  state: RootState,
): PaymentChannelEntry[] => state.superAdminPaymentChannels.series;
export const selectPaymentChannelsLoading = (state: RootState): boolean =>
  state.superAdminPaymentChannels.status === "isLoading";
export const selectPaymentChannelsError = (state: RootState): string | null =>
  state.superAdminPaymentChannels.error;
export const selectPaymentChannelsPeriod = (
  state: RootState,
): AnalyticsPeriodRange | null => state.superAdminPaymentChannels.period;
export const selectPaymentChannelsScope = (
  state: RootState,
): AnalyticsScope | null => state.superAdminPaymentChannels.scope;
export const selectPaymentChannelsStatus = (
  state: RootState,
): PaymentChannelsState["status"] => state.superAdminPaymentChannels.status;

export default paymentChannelsSlice.reducer;
