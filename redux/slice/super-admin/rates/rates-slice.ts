import { createSlice } from "@reduxjs/toolkit";
import {
  deactivateRate,
  getEffectiveRate,
  getRates,
  type PlatformRate,
} from "./rates";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface SuperAdminRatesState {
  rates: PlatformRate[];
  getRatesStatus: AsyncStatus;
  effectiveRate: PlatformRate | null;
  getEffectiveRateStatus: AsyncStatus;
  deactivateRateStatus: AsyncStatus;
  error: string | null;
}

const initialState: SuperAdminRatesState = {
  rates: [],
  getRatesStatus: "idle",
  effectiveRate: null,
  getEffectiveRateStatus: "idle",
  deactivateRateStatus: "idle",
  error: null,
};

const ratesSlice = createSlice({
  name: "superAdminRates",
  initialState,
  reducers: {
    clearRatesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRates.pending, (state) => {
        state.getRatesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getRates.fulfilled, (state, action) => {
        state.getRatesStatus = "succeeded";
        state.rates = action.payload.data;
      })
      .addCase(getRates.rejected, (state, action) => {
        state.getRatesStatus = "failed";
        state.rates = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch platform rates";
      })
      .addCase(getEffectiveRate.pending, (state) => {
        state.getEffectiveRateStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEffectiveRate.fulfilled, (state, action) => {
        state.getEffectiveRateStatus = "succeeded";
        state.effectiveRate = action.payload.data;
      })
      .addCase(getEffectiveRate.rejected, (state, action) => {
        state.getEffectiveRateStatus = "failed";
        state.effectiveRate = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch effective rate";
      })
      .addCase(deactivateRate.pending, (state) => {
        state.deactivateRateStatus = "isLoading";
        state.error = null;
      })
      .addCase(deactivateRate.fulfilled, (state, action) => {
        state.deactivateRateStatus = "succeeded";
        const deactivatedId = action.payload.id;
        state.rates = state.rates.map((rate) =>
          rate.id === deactivatedId ? { ...rate, isActive: false } : rate,
        );
        if (state.effectiveRate?.id === deactivatedId) {
          state.effectiveRate = {
            ...state.effectiveRate,
            isActive: false,
          };
        }
      })
      .addCase(deactivateRate.rejected, (state, action) => {
        state.deactivateRateStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to deactivate rate";
      });
  },
});

export const { clearRatesState } = ratesSlice.actions;
export default ratesSlice.reducer;
