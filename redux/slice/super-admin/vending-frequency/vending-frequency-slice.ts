import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  VendingFrequencyData,
} from "@/types/analytics";
import { getVendingFrequency } from "./vending-frequency";

export interface VendingFrequencyState {
  data: VendingFrequencyData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: VendingFrequencyState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const vendingFrequencySlice = createSlice({
  name: "superAdminVendingFrequency",
  initialState,
  reducers: {
    clearVendingFrequency: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getVendingFrequency.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getVendingFrequency.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getVendingFrequency.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearVendingFrequency } = vendingFrequencySlice.actions;

export const selectVendingFrequencyData = (state: RootState) =>
  state.superAdminVendingFrequency.data;
export const selectVendingFrequencyLoading = (state: RootState) =>
  state.superAdminVendingFrequency.status === "isLoading";
export const selectVendingFrequencyError = (state: RootState) =>
  state.superAdminVendingFrequency.error;
export const selectVendingFrequencyStatus = (state: RootState) =>
  state.superAdminVendingFrequency.status;

export default vendingFrequencySlice.reducer;
