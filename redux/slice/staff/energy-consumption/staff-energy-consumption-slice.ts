import { createSlice } from "@reduxjs/toolkit";
import type { EnergyConsumptionDataPoint } from "@/lib/energy-consumption-chart";
import {
  getStaffEnergyConsumptionAddressOptions,
  getStaffEnergyConsumptionChart,
  type StaffAddressFilterOption,
} from "./staff-energy-consumption";

export interface AdminEnergyConsumptionState {
  chart: EnergyConsumptionDataPoint[];
  addressOptions: StaffAddressFilterOption[];
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
  name: "staffEnergyConsumption",
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
      .addCase(getStaffEnergyConsumptionAddressOptions.pending, (state) => {
        state.addressOptionsStatus = "isLoading";
      })
      .addCase(getStaffEnergyConsumptionAddressOptions.fulfilled, (state, action) => {
        state.addressOptionsStatus = "succeeded";
        state.addressOptions = action.payload ?? [];
      })
      .addCase(getStaffEnergyConsumptionAddressOptions.rejected, (state, action) => {
        state.addressOptionsStatus = "failed";
        state.addressOptions = [{ label: "All addresses", value: "all" }];
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch address options";
      })
      .addCase(getStaffEnergyConsumptionChart.pending, (state) => {
        state.chartStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffEnergyConsumptionChart.fulfilled, (state, action) => {
        state.chartStatus = "succeeded";
        state.chart = action.payload?.chart ?? [];
        state.error = null;
      })
      .addCase(getStaffEnergyConsumptionChart.rejected, (state, action) => {
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
