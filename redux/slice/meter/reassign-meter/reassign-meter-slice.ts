import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  reassignMeter,
  type ReassignMeterResponse,
} from "./reassign-meter";

export interface ReassignMeterState {
  status: "idle" | "isLoading" | "succeeded" | "failed";
  lastResult: ReassignMeterResponse | null;
  error: string | null;
}

const initialState: ReassignMeterState = {
  status: "idle",
  lastResult: null,
  error: null,
};

const reassignMeterSlice = createSlice({
  name: "reassignMeter",
  initialState,
  reducers: {
    resetReassignMeterState: (state) => {
      state.status = "idle";
      state.lastResult = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(reassignMeter.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(reassignMeter.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastResult = action.payload ?? null;
        state.error = null;
      })
      .addCase(reassignMeter.rejected, (state, action) => {
        state.status = "failed";
        state.lastResult = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to reassign meter";
      });
  },
});

export const { resetReassignMeterState } = reassignMeterSlice.actions;

export const selectReassignMeterStatus = (state: RootState) =>
  state.reassignMeter.status;
export const selectReassignMeterLoading = (state: RootState) =>
  state.reassignMeter.status === "isLoading";
export const selectReassignMeterError = (state: RootState) =>
  state.reassignMeter.error;
export const selectReassignMeterLastResult = (state: RootState) =>
  state.reassignMeter.lastResult;

export default reassignMeterSlice.reducer;
