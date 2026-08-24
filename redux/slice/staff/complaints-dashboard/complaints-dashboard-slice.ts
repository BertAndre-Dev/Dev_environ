import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ComplaintsDashboardData } from "@/types/analytics";
import { getComplaintsDashboard } from "./complaints-dashboard";

export interface ComplaintsDashboardState {
  data: ComplaintsDashboardData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ComplaintsDashboardState = {
  data: null,
  status: "idle",
  error: null,
};

const complaintsDashboardSlice = createSlice({
  name: "staffComplaintsDashboard",
  initialState,
  reducers: {
    clearComplaintsDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getComplaintsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getComplaintsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getComplaintsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearComplaintsDashboard } = complaintsDashboardSlice.actions;

export const selectComplaintsDashboardData = (
  state: RootState,
): ComplaintsDashboardData | null => state.staffComplaintsDashboard.data;

export const selectComplaintsDashboardLoading = (state: RootState): boolean =>
  state.staffComplaintsDashboard.status === "isLoading";

export const selectComplaintsDashboardError = (
  state: RootState,
): string | null => state.staffComplaintsDashboard.error;

export const selectComplaintsDashboardStatus = (
  state: RootState,
): ComplaintsDashboardState["status"] => state.staffComplaintsDashboard.status;

export default complaintsDashboardSlice.reducer;
