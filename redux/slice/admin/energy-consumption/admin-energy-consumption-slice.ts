import { createSlice } from "@reduxjs/toolkit";
import type { EnergyConsumptionDataPoint } from "@/lib/energy-consumption-chart";
import {
  getAdminEnergyConsumptionAddressOptions,
  getAdminEnergyConsumptionChart,
  type AdminAddressFilterOption,
} from "./admin-energy-consumption";

export interface AdminEnergyConsumptionState {
  chart: EnergyConsumptionDataPoint[];
  addressOptions: AdminAddressFilterOption[];
  chartStatus: "idle" | "isLoading" | "succeeded" | "failed";
  addressOptionsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminEnergyConsumptionState = {
  chart: [],
  addressOptions: [],
  chartStatus: "idle",
  addressOptionsStatus: "idle",
  error: null,
};

const adminEnergyConsumptionSlice = createSlice({
  name: "adminEnergyConsumption",
  initialState,
  reducers: {
    clearAdminEnergyConsumption: (state) => {
      state.chart = [];
      state.addressOptions = [];
      state.chartStatus = "idle";
      state.addressOptionsStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminEnergyConsumptionAddressOptions.pending, (state) => {
        state.addressOptionsStatus = "isLoading";
      })
      .addCase(getAdminEnergyConsumptionAddressOptions.fulfilled, (state, action) => {
        state.addressOptionsStatus = "succeeded";
        state.addressOptions = action.payload ?? [];
      })
      .addCase(getAdminEnergyConsumptionAddressOptions.rejected, (state, action) => {
        state.addressOptionsStatus = "failed";
        state.addressOptions = [{ label: "All addresses", value: "all" }];
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch address options";
      })
      .addCase(getAdminEnergyConsumptionChart.pending, (state) => {
        state.chartStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAdminEnergyConsumptionChart.fulfilled, (state, action) => {
        state.chartStatus = "succeeded";
        state.chart = action.payload?.chart ?? [];
        state.error = null;
      })
      .addCase(getAdminEnergyConsumptionChart.rejected, (state, action) => {
        state.chartStatus = "failed";
        state.chart = [];
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch energy consumption chart";
      });
  },
});

export const { clearAdminEnergyConsumption } =
  adminEnergyConsumptionSlice.actions;
export default adminEnergyConsumptionSlice.reducer;
