import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  CustomerGrowthData,
  CustomerGrowthMetric,
} from "@/types/analytics";
import { getCustomerGrowth } from "./customer-growth";

export interface CustomerGrowthState {
  data: CustomerGrowthData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CustomerGrowthState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const customerGrowthSlice = createSlice({
  name: "superAdminCustomerGrowth",
  initialState,
  reducers: {
    clearCustomerGrowth: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomerGrowth.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCustomerGrowth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getCustomerGrowth.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearCustomerGrowth } = customerGrowthSlice.actions;

export const selectCustomerGrowthData = (state: RootState) =>
  state.superAdminCustomerGrowth.data;
export const selectCustomerGrowthResidents = (
  state: RootState,
): CustomerGrowthMetric | null =>
  state.superAdminCustomerGrowth.data?.residents ?? null;
export const selectCustomerGrowthMeters = (
  state: RootState,
): CustomerGrowthMetric | null =>
  state.superAdminCustomerGrowth.data?.meters ?? null;
export const selectCustomerGrowthLoading = (state: RootState) =>
  state.superAdminCustomerGrowth.status === "isLoading";
export const selectCustomerGrowthError = (state: RootState) =>
  state.superAdminCustomerGrowth.error;
export const selectCustomerGrowthStatus = (state: RootState) =>
  state.superAdminCustomerGrowth.status;
export const selectCustomerGrowthScope = (state: RootState) =>
  state.superAdminCustomerGrowth.scope;

export default customerGrowthSlice.reducer;
