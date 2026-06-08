import { createSlice } from "@reduxjs/toolkit";
import type { EstateConsumptionChartData } from "@/lib/estate-consumption-chart";
import {
  getEstateConsumptionChart,
  type EstateConsumptionChartJobMeta,
} from "./admin-estate-consumption-chart";

export interface AdminEstateConsumptionChartState {
  chart: EstateConsumptionChartData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  progress: number | null;
  jobMeta: EstateConsumptionChartJobMeta | null;
  message: string | null;
  error: string | null;
}

const initialState: AdminEstateConsumptionChartState = {
  chart: null,
  status: "idle",
  progress: null,
  jobMeta: null,
  message: null,
  error: null,
};

const adminEstateConsumptionChartSlice = createSlice({
  name: "adminEstateConsumptionChart",
  initialState,
  reducers: {
    clearAdminEstateConsumptionChart: (state) => {
      state.chart = null;
      state.status = "idle";
      state.progress = null;
      state.jobMeta = null;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateConsumptionChart.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
        state.message = null;
        state.progress = 0;
      })
      .addCase(getEstateConsumptionChart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.chart = action.payload.chart;
        state.jobMeta = action.payload.meta;
        state.progress = action.payload.meta.progress ?? 100;
        state.message = action.payload.chart.message ?? null;
        state.error = null;
      })
      .addCase(getEstateConsumptionChart.rejected, (state, action) => {
        state.status = "failed";
        state.chart = null;
        state.progress = null;
        state.message = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          null;
      });
  },
});

export const { clearAdminEstateConsumptionChart } =
  adminEstateConsumptionChartSlice.actions;

export default adminEstateConsumptionChartSlice.reducer;
