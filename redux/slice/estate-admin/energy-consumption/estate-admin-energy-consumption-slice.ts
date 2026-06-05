import { createSlice } from "@reduxjs/toolkit";
import type { EnergyConsumptionDataPoint } from "@/lib/energy-consumption-chart";
import {
  getEstateAdminEnergyConsumptionAddressOptions,
  getEstateAdminEnergyConsumptionChart,
  type EstateAdminAddressFilterOption,
} from "./estate-admin-energy-consumption";

export interface EstateAdminEnergyConsumptionState {
  chart: EnergyConsumptionDataPoint[];
  addressOptions: EstateAdminAddressFilterOption[];
  chartStatus: "idle" | "isLoading" | "succeeded" | "failed";
  addressOptionsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EstateAdminEnergyConsumptionState = {
  chart: [],
  addressOptions: [],
  chartStatus: "idle",
  addressOptionsStatus: "idle",
  error: null,
};

const estateAdminEnergyConsumptionSlice = createSlice({
  name: "estateAdminEnergyConsumption",
  initialState,
  reducers: {
    clearEstateAdminEnergyConsumption: (state) => {
      state.chart = [];
      state.addressOptions = [];
      state.chartStatus = "idle";
      state.addressOptionsStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminEnergyConsumptionAddressOptions.pending, (state) => {
        state.addressOptionsStatus = "isLoading";
      })
      .addCase(
        getEstateAdminEnergyConsumptionAddressOptions.fulfilled,
        (state, action) => {
          state.addressOptionsStatus = "succeeded";
          state.addressOptions = action.payload ?? [];
        },
      )
      .addCase(
        getEstateAdminEnergyConsumptionAddressOptions.rejected,
        (state, action) => {
          state.addressOptionsStatus = "failed";
          state.addressOptions = [{ label: "All addresses", value: "all" }];
          state.error =
            (action.payload as { message?: string } | undefined)?.message ||
            action.error.message ||
            "Failed to fetch address options";
        },
      )
      .addCase(getEstateAdminEnergyConsumptionChart.pending, (state) => {
        state.chartStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminEnergyConsumptionChart.fulfilled, (state, action) => {
        state.chartStatus = "succeeded";
        state.chart = action.payload?.chart ?? [];
        state.error = null;
      })
      .addCase(getEstateAdminEnergyConsumptionChart.rejected, (state, action) => {
        state.chartStatus = "failed";
        state.chart = [];
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch energy consumption chart";
      });
  },
});

export const { clearEstateAdminEnergyConsumption } =
  estateAdminEnergyConsumptionSlice.actions;
export default estateAdminEnergyConsumptionSlice.reducer;
