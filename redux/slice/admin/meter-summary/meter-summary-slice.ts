import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { MeterSummaryData } from "@/types/analytics";
import { getMeterSummary } from "./meter-summary";

export interface MeterSummaryState {
  data: MeterSummaryData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: MeterSummaryState = {
  data: null,
  status: "idle",
  error: null,
};

const meterSummarySlice = createSlice({
  name: "adminMeterSummary",
  initialState,
  reducers: {
    clearMeterSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMeterSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getMeterSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getMeterSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearMeterSummary } = meterSummarySlice.actions;

export const selectMeterSummaryData = (state: RootState): MeterSummaryData | null =>
  state.adminMeterSummary.data;

export const selectMeterSummaryLoading = (state: RootState): boolean =>
  state.adminMeterSummary.status === "isLoading";

export const selectMeterSummaryError = (state: RootState): string | null =>
  state.adminMeterSummary.error;

export const selectMeterSummaryStatus = (
  state: RootState,
): MeterSummaryState["status"] => state.adminMeterSummary.status;

export default meterSummarySlice.reducer;
