import { createSlice } from "@reduxjs/toolkit";
import {
  createFlutterwaveVirtualAccount,
  getFlutterwaveVirtualAccount,
  type FlutterwaveVirtualAccount,
} from "./flutterwave-va";

type LoadState = "idle" | "isLoading" | "succeeded" | "failed";

export interface ResidentFlutterwaveVaState {
  getVirtualAccountState: LoadState;
  createVirtualAccountState: LoadState;
  virtualAccount: FlutterwaveVirtualAccount | null;
  error: string | null;
}

const initialState: ResidentFlutterwaveVaState = {
  getVirtualAccountState: "idle",
  createVirtualAccountState: "idle",
  virtualAccount: null,
  error: null,
};

function rejectMessage(action: {
  payload?: unknown;
  error?: { message?: string };
}): string | null {
  const payload = action.payload as { message?: string } | undefined;
  return payload?.message || action.error?.message || null;
}

const residentFlutterwaveVaSlice = createSlice({
  name: "residentFlutterwaveVa",
  initialState,
  reducers: {
    clearFlutterwaveVaError: (state) => {
      state.error = null;
    },
    resetFlutterwaveVa: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(getFlutterwaveVirtualAccount.pending, (state) => {
        state.getVirtualAccountState = "isLoading";
        state.error = null;
      })
      .addCase(getFlutterwaveVirtualAccount.fulfilled, (state, action) => {
        state.getVirtualAccountState = "succeeded";
        state.virtualAccount = action.payload;
      })
      .addCase(getFlutterwaveVirtualAccount.rejected, (state, action) => {
        state.getVirtualAccountState = "failed";
        state.error = rejectMessage(action);
      })

      .addCase(createFlutterwaveVirtualAccount.pending, (state) => {
        state.createVirtualAccountState = "isLoading";
        state.error = null;
      })
      .addCase(createFlutterwaveVirtualAccount.fulfilled, (state, action) => {
        state.createVirtualAccountState = "succeeded";
        state.virtualAccount = action.payload;
      })
      .addCase(createFlutterwaveVirtualAccount.rejected, (state, action) => {
        state.createVirtualAccountState = "failed";
        state.error = rejectMessage(action);
      });
  },
});

export const { clearFlutterwaveVaError, resetFlutterwaveVa } =
  residentFlutterwaveVaSlice.actions;

export default residentFlutterwaveVaSlice.reducer;
