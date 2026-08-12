import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  AveragePurchaseValueData,
} from "@/types/analytics";
import { getAveragePurchaseValue } from "./average-purchase";

export interface AveragePurchaseState {
  data: AveragePurchaseValueData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AveragePurchaseState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const averagePurchaseSlice = createSlice({
  name: "superAdminAveragePurchase",
  initialState,
  reducers: {
    clearAveragePurchase: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAveragePurchaseValue.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getAveragePurchaseValue.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getAveragePurchaseValue.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearAveragePurchase } = averagePurchaseSlice.actions;

export const selectAveragePurchaseData = (state: RootState) =>
  state.superAdminAveragePurchase.data;
export const selectAveragePurchaseLoading = (state: RootState) =>
  state.superAdminAveragePurchase.status === "isLoading";
export const selectAveragePurchaseError = (state: RootState) =>
  state.superAdminAveragePurchase.error;
export const selectAveragePurchaseStatus = (state: RootState) =>
  state.superAdminAveragePurchase.status;

export default averagePurchaseSlice.reducer;
