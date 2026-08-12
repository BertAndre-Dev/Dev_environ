import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  TopEstateEnergyEntry,
} from "@/types/analytics";
import { getTopEstatesEnergy } from "./top-estates-energy";

export interface TopEstatesEnergyState {
  series: TopEstateEnergyEntry[];
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TopEstatesEnergyState = {
  series: [],
  scope: null,
  status: "idle",
  error: null,
};

const topEstatesEnergySlice = createSlice({
  name: "superAdminTopEstatesEnergy",
  initialState,
  reducers: {
    clearTopEstatesEnergy: (state) => {
      state.series = [];
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTopEstatesEnergy.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getTopEstatesEnergy.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.series = action.payload?.data ?? [];
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getTopEstatesEnergy.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearTopEstatesEnergy } = topEstatesEnergySlice.actions;

export const selectTopEstatesEnergySeries = (
  state: RootState,
): TopEstateEnergyEntry[] => state.superAdminTopEstatesEnergy.series;
export const selectTopEstatesEnergyLoading = (state: RootState): boolean =>
  state.superAdminTopEstatesEnergy.status === "isLoading";
export const selectTopEstatesEnergyError = (state: RootState): string | null =>
  state.superAdminTopEstatesEnergy.error;
export const selectTopEstatesEnergyStatus = (
  state: RootState,
): TopEstatesEnergyState["status"] => state.superAdminTopEstatesEnergy.status;
export const selectTopEstatesEnergyScope = (
  state: RootState,
): AnalyticsScope | null => state.superAdminTopEstatesEnergy.scope;

export default topEstatesEnergySlice.reducer;
