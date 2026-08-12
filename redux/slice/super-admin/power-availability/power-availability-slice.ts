import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { AnalyticsScope, PowerAvailabilityData } from "@/types/analytics";
import { getPowerAvailability } from "./power-availability";
import { getApiErrorMessage } from "@/lib/api-error";

export interface PowerAvailabilityState {
  data: PowerAvailabilityData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PowerAvailabilityState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const powerAvailabilitySlice = createSlice({
  name: "superAdminPowerAvailability",
  initialState,
  reducers: {
    clearPowerAvailability: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPowerAvailability.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getPowerAvailability.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getPowerAvailability.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearPowerAvailability } = powerAvailabilitySlice.actions;

export const selectPowerAvailabilityData = (state: RootState) =>
  state.superAdminPowerAvailability.data;
export const selectPowerAvailabilityLoading = (state: RootState) =>
  state.superAdminPowerAvailability.status === "isLoading";
export const selectPowerAvailabilityError = (state: RootState) =>
  state.superAdminPowerAvailability.error;
export const selectPowerAvailabilityStatus = (state: RootState) =>
  state.superAdminPowerAvailability.status;
export const selectPowerAvailabilityScope = (state: RootState) =>
  state.superAdminPowerAvailability.scope;

export default powerAvailabilitySlice.reducer;
