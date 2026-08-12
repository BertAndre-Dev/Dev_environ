import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getEnergyProviderConfigs,
  setEnergyProviderConfig,
  type EnergyProviderConfigRow,
} from "./energy-provider-config";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface SuperAdminEnergyProviderConfigState {
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

const initialState: SuperAdminEnergyProviderConfigState = {
  list: [],
  pagination: null,
  getListStatus: "idle",
  setConfigStatus: "idle",
  lastMessage: null,
  error: null,
};

const energyProviderConfigSlice = createSlice({
  name: "superAdminEnergyProviderConfig",
  initialState,
  reducers: {
    clearEnergyProviderConfigFeedback: (state) => {
      state.setConfigStatus = "idle";
      state.lastMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEnergyProviderConfigs.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEnergyProviderConfigs.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getEnergyProviderConfigs.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(setEnergyProviderConfig.pending, (state) => {
        state.setConfigStatus = "isLoading";
        state.error = null;
        state.lastMessage = null;
      })
      .addCase(setEnergyProviderConfig.fulfilled, (state, action) => {
        state.setConfigStatus = "succeeded";
        state.lastMessage =
          action.payload?.message ?? "Energy provider commission configured.";
      })
      .addCase(setEnergyProviderConfig.rejected, (state, action) => {
        state.setConfigStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearEnergyProviderConfigFeedback } =
  energyProviderConfigSlice.actions;
export default energyProviderConfigSlice.reducer;
