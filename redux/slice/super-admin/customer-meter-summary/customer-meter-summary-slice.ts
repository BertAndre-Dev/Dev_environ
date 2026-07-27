import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  AnalyticsScope,
  CustomerMeterSummaryData,
} from "@/types/analytics";
import {
  getCustomerMeterSummary,
  type GetCustomerMeterSummaryArgs,
} from "./customer-meter-summary";

export interface CustomerMeterSummaryState {
  selectedEstateId: string | undefined;
  data: CustomerMeterSummaryData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CustomerMeterSummaryState = {
  selectedEstateId: undefined,
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

function normalizeEstateId(id: string | undefined): string | undefined {
  const trimmed = id?.trim();
  return trimmed || undefined;
}

function argMatchesSelection(
  arg: GetCustomerMeterSummaryArgs | undefined,
  selectedEstateId: string | undefined,
): boolean {
  return normalizeEstateId(arg?.estateId) === selectedEstateId;
}

const customerMeterSummarySlice = createSlice({
  name: "superAdminCustomerMeterSummary",
  initialState,
  reducers: {
    setSelectedEstateId: (
      state,
      action: PayloadAction<string | undefined>,
    ) => {
      state.selectedEstateId = normalizeEstateId(action.payload);
    },
    clearCustomerMeterSummary: (state) => {
      state.selectedEstateId = undefined;
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomerMeterSummary.pending, (state, action) => {
        if (!argMatchesSelection(action.meta.arg, state.selectedEstateId)) {
          return;
        }
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCustomerMeterSummary.fulfilled, (state, action) => {
        if (!argMatchesSelection(action.meta.arg, state.selectedEstateId)) {
          return;
        }
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getCustomerMeterSummary.rejected, (state, action) => {
        if (!argMatchesSelection(action.meta.arg, state.selectedEstateId)) {
          return;
        }
        state.status = "failed";
        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to fetch customer & meter summary";
      });
  },
});

export const { setSelectedEstateId, clearCustomerMeterSummary } =
  customerMeterSummarySlice.actions;

export const selectCustomerMeterSummaryData = (
  state: RootState,
): CustomerMeterSummaryData | null =>
  state.superAdminCustomerMeterSummary.data;

export const selectCustomerMeterSummaryScope = (
  state: RootState,
): AnalyticsScope | null => state.superAdminCustomerMeterSummary.scope;

export const selectCustomerMeterSummaryLoading = (state: RootState): boolean =>
  state.superAdminCustomerMeterSummary.status === "isLoading";

export const selectCustomerMeterSummaryError = (
  state: RootState,
): string | null => state.superAdminCustomerMeterSummary.error;

export const selectCustomerMeterSummarySelectedEstateId = (
  state: RootState,
): string | undefined =>
  state.superAdminCustomerMeterSummary.selectedEstateId;

export const selectCustomerMeterSummaryStatus = (
  state: RootState,
): CustomerMeterSummaryState["status"] =>
  state.superAdminCustomerMeterSummary.status;

export default customerMeterSummarySlice.reducer;
