import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  AnalyticsScope,
  MeterCommunicationStatusData,
} from "@/types/analytics";
import { getMeterCommunicationStatus } from "./meter-communication-status";

export interface MeterCommunicationStatusState {
  data: MeterCommunicationStatusData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: MeterCommunicationStatusState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const meterCommunicationStatusSlice = createSlice({
  name: "superAdminMeterCommunicationStatus",
  initialState,
  reducers: {
    clearMeterCommunicationStatus: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMeterCommunicationStatus.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getMeterCommunicationStatus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getMeterCommunicationStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch meter communication status";
      });
  },
});

export const { clearMeterCommunicationStatus } =
  meterCommunicationStatusSlice.actions;

export const selectMeterCommunicationStatusData = (state: RootState) =>
  state.superAdminMeterCommunicationStatus.data;
export const selectMeterCommunicationStatusLoading = (state: RootState) =>
  state.superAdminMeterCommunicationStatus.status === "isLoading";
export const selectMeterCommunicationStatusError = (state: RootState) =>
  state.superAdminMeterCommunicationStatus.error;
export const selectMeterCommunicationStatusStatus = (state: RootState) =>
  state.superAdminMeterCommunicationStatus.status;
export const selectMeterCommunicationStatusScope = (state: RootState) =>
  state.superAdminMeterCommunicationStatus.scope;

export default meterCommunicationStatusSlice.reducer;
