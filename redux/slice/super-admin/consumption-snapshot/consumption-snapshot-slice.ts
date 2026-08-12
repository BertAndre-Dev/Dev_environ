import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  ConsumptionSnapshotData,
} from "@/types/analytics";
import { getConsumptionSnapshot } from "./consumption-snapshot";

export interface ConsumptionSnapshotState {
  data: ConsumptionSnapshotData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ConsumptionSnapshotState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const consumptionSnapshotSlice = createSlice({
  name: "superAdminConsumptionSnapshot",
  initialState,
  reducers: {
    clearConsumptionSnapshot: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getConsumptionSnapshot.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getConsumptionSnapshot.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getConsumptionSnapshot.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearConsumptionSnapshot } = consumptionSnapshotSlice.actions;

export const selectConsumptionSnapshotData = (state: RootState) =>
  state.superAdminConsumptionSnapshot.data;
export const selectConsumptionSnapshotScope = (state: RootState) =>
  state.superAdminConsumptionSnapshot.scope;
export const selectConsumptionSnapshotLoading = (state: RootState) =>
  state.superAdminConsumptionSnapshot.status === "isLoading";
export const selectConsumptionSnapshotError = (state: RootState) =>
  state.superAdminConsumptionSnapshot.error;
export const selectConsumptionSnapshotStatus = (state: RootState) =>
  state.superAdminConsumptionSnapshot.status;

export default consumptionSnapshotSlice.reducer;
