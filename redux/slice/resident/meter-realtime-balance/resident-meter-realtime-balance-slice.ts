import { createSlice } from "@reduxjs/toolkit";
import type { MeterRealtimeBalanceData } from "@/lib/meter-realtime-balance";
import { getMeterRealtimeBalance } from "./resident-meter-realtime-balance";

export interface ResidentMeterRealtimeBalanceState {
  balance: MeterRealtimeBalanceData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  message: string | null;
  error: string | null;
}

const initialState: ResidentMeterRealtimeBalanceState = {
  balance: null,
  status: "idle",
  message: null,
  error: null,
};

const residentMeterRealtimeBalanceSlice = createSlice({
  name: "residentMeterRealtimeBalance",
  initialState,
  reducers: {
    clearResidentMeterRealtimeBalance: (state) => {
      state.balance = null;
      state.status = "idle";
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMeterRealtimeBalance.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
        state.message = null;
      })
      .addCase(getMeterRealtimeBalance.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.balance = action.payload.balance;
        state.message = action.payload.balance.message ?? null;
        state.error = null;
      })
      .addCase(getMeterRealtimeBalance.rejected, (state, action) => {
        state.status = "failed";
        state.balance = null;
        state.message = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          null;
      });
  },
});

export const { clearResidentMeterRealtimeBalance } =
  residentMeterRealtimeBalanceSlice.actions;

export default residentMeterRealtimeBalanceSlice.reducer;
