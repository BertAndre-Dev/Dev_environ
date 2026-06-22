import { createSlice } from "@reduxjs/toolkit";
import {
  getCompanyEnergyProviderVends,
  type CompanyEnergyProviderVendsPagination,
} from "./company-energy-provider-vends";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyEnergyProviderVendsState {
  list: EnergyProviderVendRow[];
  pagination: CompanyEnergyProviderVendsPagination | null;
  status: AsyncStatus;
  error: string | null;
}

const initialState: CompanyEnergyProviderVendsState = {
  list: [],
  pagination: null,
  status: "idle",
  error: null,
};

const companyEnergyProviderVendsSlice = createSlice({
  name: "companyEnergyProviderVends",
  initialState,
  reducers: {
    clearCompanyEnergyProviderVends: (state) => {
      state.list = [];
      state.pagination = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyEnergyProviderVends.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyEnergyProviderVends.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCompanyEnergyProviderVends.rejected, (state, action) => {
        state.status = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch vend history";
      });
  },
});

export const { clearCompanyEnergyProviderVends } =
  companyEnergyProviderVendsSlice.actions;
export default companyEnergyProviderVendsSlice.reducer;
