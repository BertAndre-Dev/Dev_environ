import { createSlice } from "@reduxjs/toolkit";
import type { EstateRealtimeReadingsData } from "@/lib/estate-realtime-readings";
import {
  getEstateRealtimeReadings,
  type EstateRealtimeReadingsJobMeta,
} from "./admin-estate-realtime-readings";

export interface AdminEstateRealtimeReadingsState {
  readings: EstateRealtimeReadingsData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  progress: number | null;
  jobMeta: EstateRealtimeReadingsJobMeta | null;
  message: string | null;
  error: string | null;
}

const initialState: AdminEstateRealtimeReadingsState = {
  readings: null,
  status: "idle",
  progress: null,
  jobMeta: null,
  message: null,
  error: null,
};

const adminEstateRealtimeReadingsSlice = createSlice({
  name: "adminEstateRealtimeReadings",
  initialState,
  reducers: {
    clearAdminEstateRealtimeReadings: (state) => {
      state.readings = null;
      state.status = "idle";
      state.progress = null;
      state.jobMeta = null;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateRealtimeReadings.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
        state.message = null;
        state.progress = 0;
      })
      .addCase(getEstateRealtimeReadings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.readings = action.payload.readings;
        state.jobMeta = action.payload.meta;
        state.progress = action.payload.meta.progress ?? 100;
        state.message = action.payload.readings.message ?? null;
        state.error = null;
      })
      .addCase(getEstateRealtimeReadings.rejected, (state, action) => {
        state.status = "failed";
        state.readings = null;
        state.progress = null;
        state.message = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          null;
      });
  },
});

export const { clearAdminEstateRealtimeReadings } =
  adminEstateRealtimeReadingsSlice.actions;

export default adminEstateRealtimeReadingsSlice.reducer;
