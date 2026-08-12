import { createSlice } from "@reduxjs/toolkit";
import type { EstateEnergyUsageData } from "@/lib/estate-energy-usage-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getSuperAdminEstateEnergyUsage,
  type SuperAdminEstateEnergyUsageJobMeta,
} from "./super-admin-estate-energy-usage";

export interface SuperAdminEstateEnergyUsageState {
  usage: EstateEnergyUsageData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  progress: number | null;
  jobMeta: SuperAdminEstateEnergyUsageJobMeta | null;
  message: string | null;
  error: string | null;
}

const initialState: SuperAdminEstateEnergyUsageState = {
  usage: null,
  status: "idle",
  progress: null,
  jobMeta: null,
  message: null,
  error: null,
};

const superAdminEstateEnergyUsageSlice = createSlice({
  name: "superAdminEstateEnergyUsage",
  initialState,
  reducers: {
    clearSuperAdminEstateEnergyUsage: (state) => {
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
      .addCase(getSuperAdminEstateEnergyUsage.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
        state.message = null;
        state.progress = 0;
      })
      .addCase(getSuperAdminEstateEnergyUsage.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.usage = action.payload.usage;
        state.jobMeta = action.payload.meta;
        state.progress = action.payload.meta.progress ?? 100;
        state.message = action.payload.usage.message ?? null;
        state.error = null;
      })
      .addCase(getSuperAdminEstateEnergyUsage.rejected, (state, action) => {
        state.status = "failed";
        state.usage = null;
        state.progress = null;
        state.message = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearSuperAdminEstateEnergyUsage } =
  superAdminEstateEnergyUsageSlice.actions;

export default superAdminEstateEnergyUsageSlice.reducer;
