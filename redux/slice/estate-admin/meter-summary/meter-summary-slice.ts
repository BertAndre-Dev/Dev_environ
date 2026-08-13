import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { MeterSummaryData } from "@/types/analytics";
import { getEstateAdminMeterSummary } from "./meter-summary";

export interface EstateAdminMeterSummaryState {
  data: MeterSummaryData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EstateAdminMeterSummaryState = {
  data: null,
  status: "idle",
  error: null,
};

const estateAdminMeterSummarySlice = createSlice({
  name: "estateAdminMeterSummary",
  initialState,
  reducers: {
    clearEstateAdminMeterSummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminMeterSummary.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminMeterSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getEstateAdminMeterSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearEstateAdminMeterSummary } =
  estateAdminMeterSummarySlice.actions;

export const selectEstateAdminMeterSummaryData = (
  state: RootState,
): MeterSummaryData | null => state.estateAdminMeterSummary.data;

export const selectEstateAdminMeterSummaryLoading = (
  state: RootState,
): boolean => state.estateAdminMeterSummary.status === "isLoading";

export const selectEstateAdminMeterSummaryError = (
  state: RootState,
): string | null => state.estateAdminMeterSummary.error;

export const selectEstateAdminMeterSummaryStatus = (
  state: RootState,
): EstateAdminMeterSummaryState["status"] =>
  state.estateAdminMeterSummary.status;

export default estateAdminMeterSummarySlice.reducer;
