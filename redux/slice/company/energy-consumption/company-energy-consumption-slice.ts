import { createSlice } from "@reduxjs/toolkit";
import type { EnergyConsumptionDataPoint } from "@/lib/energy-consumption-chart";
import {
  getCompanyEnergyConsumptionAddressOptions,
  getCompanyEnergyConsumptionChart,
  type CompanyAddressFilterOption,
} from "./company-energy-consumption";

export interface CompanyEnergyConsumptionState {
  chart: EnergyConsumptionDataPoint[];
  addressOptions: CompanyAddressFilterOption[];
  chartStatus: "idle" | "isLoading" | "succeeded" | "failed";
  addressOptionsStatus: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CompanyEnergyConsumptionState = {
  chart: [],
  addressOptions: [],
  chartStatus: "idle",
  addressOptionsStatus: "idle",
  error: null,
};

const companyEnergyConsumptionSlice = createSlice({
  name: "companyEnergyConsumption",
  initialState,
  reducers: {
    clearCompanyEnergyConsumption: (state) => {
      state.chart = [];
      state.addressOptions = [];
      state.chartStatus = "idle";
      state.addressOptionsStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyEnergyConsumptionAddressOptions.pending, (state) => {
        state.addressOptionsStatus = "isLoading";
      })
      .addCase(
        getCompanyEnergyConsumptionAddressOptions.fulfilled,
        (state, action) => {
          state.addressOptionsStatus = "succeeded";
          state.addressOptions = action.payload ?? [];
        },
      )
      .addCase(
        getCompanyEnergyConsumptionAddressOptions.rejected,
        (state, action) => {
          state.addressOptionsStatus = "failed";
          state.addressOptions = [{ label: "All addresses", value: "all" }];
          state.error =
            (action.payload as { message?: string } | undefined)?.message ||
            action.error.message ||
            "Failed to fetch address options";
        },
      )
      .addCase(getCompanyEnergyConsumptionChart.pending, (state) => {
        state.chartStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyEnergyConsumptionChart.fulfilled, (state, action) => {
        state.chartStatus = "succeeded";
        state.chart = action.payload?.chart ?? [];
        state.error = null;
      })
      .addCase(getCompanyEnergyConsumptionChart.rejected, (state, action) => {
        state.chartStatus = "failed";
        state.chart = [];
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch energy consumption chart";
      });
  },
});

export const { clearCompanyEnergyConsumption } =
  companyEnergyConsumptionSlice.actions;
export default companyEnergyConsumptionSlice.reducer;
