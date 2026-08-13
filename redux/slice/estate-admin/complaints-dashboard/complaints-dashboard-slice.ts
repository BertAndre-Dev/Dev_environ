import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ComplaintsDashboardData } from "@/types/analytics";
import { getEstateAdminComplaintsDashboard } from "./complaints-dashboard";

export interface EstateAdminComplaintsDashboardState {
  data: ComplaintsDashboardData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EstateAdminComplaintsDashboardState = {
  data: null,
  status: "idle",
  error: null,
};

const estateAdminComplaintsDashboardSlice = createSlice({
  name: "estateAdminComplaintsDashboard",
  initialState,
  reducers: {
    clearEstateAdminComplaintsDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminComplaintsDashboard.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminComplaintsDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getEstateAdminComplaintsDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearEstateAdminComplaintsDashboard } =
  estateAdminComplaintsDashboardSlice.actions;

export const selectEstateAdminComplaintsDashboardData = (
  state: RootState,
): ComplaintsDashboardData | null => state.estateAdminComplaintsDashboard.data;

export const selectEstateAdminComplaintsDashboardLoading = (
  state: RootState,
): boolean => state.estateAdminComplaintsDashboard.status === "isLoading";

export const selectEstateAdminComplaintsDashboardError = (
  state: RootState,
): string | null => state.estateAdminComplaintsDashboard.error;

export const selectEstateAdminComplaintsDashboardStatus = (
  state: RootState,
): EstateAdminComplaintsDashboardState["status"] =>
  state.estateAdminComplaintsDashboard.status;

export default estateAdminComplaintsDashboardSlice.reducer;
