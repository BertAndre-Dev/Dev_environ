import { createSlice } from "@reduxjs/toolkit";
import type { EstateEnergyUsageData } from "@/lib/estate-energy-usage-chart";
import {
  getEstateEnergyUsage,
  type EstateEnergyUsageJobMeta,
} from "./admin-estate-energy-usage";

export interface AdminEstateEnergyUsageState {
  usage: EstateEnergyUsageData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  progress: number | null;
  jobMeta: EstateEnergyUsageJobMeta | null;
  message: string | null;
  error: string | null;
}

const initialState: AdminEstateEnergyUsageState = {
  usage: null,
  status: "idle",
  progress: null,
  jobMeta: null,
  message: null,
  error: null,
};

const adminEstateEnergyUsageSlice = createSlice({
  name: "adminEstateEnergyUsage",
  initialState,
  reducers: {
    clearAdminEstateEnergyUsage: (state) => {
      state.usage = null;
      state.status = "idle";
      state.progress = null;
      state.jobMeta = null;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateEnergyUsage.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
        state.message = null;
        state.progress = 0;
      })
      .addCase(getEstateEnergyUsage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.usage = action.payload.usage;
        state.jobMeta = action.payload.meta;
        state.progress = action.payload.meta.progress ?? 100;
        state.message = action.payload.usage.message ?? null;
        state.error = null;
      })
      .addCase(getEstateEnergyUsage.rejected, (state, action) => {
        state.status = "failed";
        state.usage = null;
        state.progress = null;
        state.message = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          null;
      });
  },
});

export const { clearAdminEstateEnergyUsage } =
  adminEstateEnergyUsageSlice.actions;

export default adminEstateEnergyUsageSlice.reducer;
