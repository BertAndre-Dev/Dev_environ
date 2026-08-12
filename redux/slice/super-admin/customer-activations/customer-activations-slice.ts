import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  CustomerActivationsData,
} from "@/types/analytics";
import { getCustomerActivations } from "./customer-activations";

export interface CustomerActivationsState {
  data: CustomerActivationsData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CustomerActivationsState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const customerActivationsSlice = createSlice({
  name: "superAdminCustomerActivations",
  initialState,
  reducers: {
    clearCustomerActivations: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomerActivations.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCustomerActivations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getCustomerActivations.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearCustomerActivations } = customerActivationsSlice.actions;

export const selectCustomerActivationsData = (
  state: RootState,
): CustomerActivationsData | null =>
  state.superAdminCustomerActivations.data;

export const selectCustomerActivationsScope = (
  state: RootState,
): AnalyticsScope | null => state.superAdminCustomerActivations.scope;

export const selectCustomerActivationsLoading = (state: RootState): boolean =>
  state.superAdminCustomerActivations.status === "isLoading";

export const selectCustomerActivationsError = (
  state: RootState,
): string | null => state.superAdminCustomerActivations.error;

export const selectCustomerActivationsStatus = (
  state: RootState,
): CustomerActivationsState["status"] =>
  state.superAdminCustomerActivations.status;

export default customerActivationsSlice.reducer;
