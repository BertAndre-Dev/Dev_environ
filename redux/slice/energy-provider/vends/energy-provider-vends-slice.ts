import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getEnergyProviderVends,
  type EnergyProviderVendsPagination,
} from "./energy-provider-vends";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EnergyProviderVendsState {
  list: EnergyProviderVendRow[];
  pagination: EnergyProviderVendsPagination | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: EnergyProviderVendsState = {
  list: [],
  pagination: null,
  status: "idle",
  error: null,
};

const energyProviderVendsSlice = createSlice({
  name: "energyProviderVends",
  initialState,
  reducers: {
    clearEnergyProviderVends: (state) => {
      state.list = [];
      state.pagination = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEnergyProviderVends.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getEnergyProviderVends.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getEnergyProviderVends.rejected, (state, action) => {
        state.status = "failed";
        state.list = [];
        state.pagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearEnergyProviderVends } = energyProviderVendsSlice.actions;
export default energyProviderVendsSlice.reducer;
