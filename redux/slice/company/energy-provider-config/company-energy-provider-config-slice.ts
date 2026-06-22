import { createSlice } from "@reduxjs/toolkit";
import {
  getCompanyEnergyProviderConfigs,
  setCompanyEnergyProviderConfig,
  type EnergyProviderConfigRow,
} from "./company-energy-provider-config";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyEnergyProviderConfigState {
  list: EnergyProviderConfigRow[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  } | null;
  getListStatus: AsyncStatus;
  setConfigStatus: AsyncStatus;
  lastMessage: string | null;
  error: string | null;
}

const initialState: CompanyEnergyProviderConfigState = {
  list: [],
  pagination: null,
  getListStatus: "idle",
  setConfigStatus: "idle",
  lastMessage: null,
  error: null,
};

const companyEnergyProviderConfigSlice = createSlice({
  name: "companyEnergyProviderConfig",
  initialState,
  reducers: {
    clearCompanyEnergyProviderConfigFeedback: (state) => {
      state.setConfigStatus = "idle";
      state.lastMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyEnergyProviderConfigs.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyEnergyProviderConfigs.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getCompanyEnergyProviderConfigs.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch energy provider configurations";
      })
      .addCase(setCompanyEnergyProviderConfig.pending, (state) => {
        state.setConfigStatus = "isLoading";
        state.error = null;
        state.lastMessage = null;
      })
      .addCase(setCompanyEnergyProviderConfig.fulfilled, (state, action) => {
        state.setConfigStatus = "succeeded";
        state.lastMessage =
          action.payload?.message ?? "Energy provider commission configured.";
      })
      .addCase(setCompanyEnergyProviderConfig.rejected, (state, action) => {
        state.setConfigStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to set energy provider commission";
      });
  },
});

export const { clearCompanyEnergyProviderConfigFeedback } =
  companyEnergyProviderConfigSlice.actions;
export default companyEnergyProviderConfigSlice.reducer;
