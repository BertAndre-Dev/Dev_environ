import { createSlice } from "@reduxjs/toolkit";
import type { EnergyConsumptionDataPoint } from "@/lib/energy-consumption-chart";
import { getSuperAdminEnergyConsumptionChart } from "./super-admin-energy-consumption";
import { getApiErrorMessage } from "@/lib/api-error";

export interface SuperAdminEnergyConsumptionState {
  chart: EnergyConsumptionDataPoint[];
  chartStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SuperAdminEnergyConsumptionState = {
  chart: [],
  chartStatus: "idle",
  error: null,
};

const superAdminEnergyConsumptionSlice = createSlice({
  name: "superAdminEnergyConsumption",
  initialState,
  reducers: {
    clearSuperAdminEnergyConsumption: (state) => {
      state.chart = [];
      state.chartStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSuperAdminEnergyConsumptionChart.pending, (state) => {
        state.chartStatus = "isLoading";
        state.error = null;
      })
      .addCase(getSuperAdminEnergyConsumptionChart.fulfilled, (state, action) => {
        state.chartStatus = "succeeded";
        state.chart = action.payload?.chart ?? [];
        state.error = null;
      })
      .addCase(getSuperAdminEnergyConsumptionChart.rejected, (state, action) => {
        state.chartStatus = "failed";
        state.chart = [];
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearSuperAdminEnergyConsumption } =
  superAdminEnergyConsumptionSlice.actions;

export default superAdminEnergyConsumptionSlice.reducer;
