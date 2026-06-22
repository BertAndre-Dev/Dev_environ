import { createSlice } from "@reduxjs/toolkit";
import {
  getEnergyProviderTransactionVends,
  type EnergyProviderTransactionPagination,
} from "./energy-provider-transaction";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EnergyProviderTransactionState {
  list: EnergyProviderVendRow[];
  pagination: EnergyProviderTransactionPagination | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: EnergyProviderTransactionState = {
  list: [],
  pagination: null,
  status: "idle",
  error: null,
};

const energyProviderTransactionSlice = createSlice({
  name: "energyProviderTransaction",
  initialState,
  reducers: {
    clearEnergyProviderTransactions: (state) => {
      state.list = [];
      state.pagination = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEnergyProviderTransactionVends.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getEnergyProviderTransactionVends.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getEnergyProviderTransactionVends.rejected, (state, action) => {
        state.status = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch transactions";
      });
  },
});

export const { clearEnergyProviderTransactions } =
  energyProviderTransactionSlice.actions;
export default energyProviderTransactionSlice.reducer;
