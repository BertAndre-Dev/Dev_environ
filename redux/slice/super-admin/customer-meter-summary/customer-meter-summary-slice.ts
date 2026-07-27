import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  AnalyticsScope,
  CustomerMeterSummaryData,
} from "@/types/analytics";
import {
  getCustomerMeterSummary,
  type CustomerMeterSummaryFilter,
  type GetCustomerMeterSummaryArgs,
} from "./customer-meter-summary";

export interface CustomerMeterSummaryState {
  filter: CustomerMeterSummaryFilter;
  data: CustomerMeterSummaryData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CustomerMeterSummaryState = {
  filter: { mode: "estate", estateId: "" },
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

function normalizeId(id: string | undefined): string {
  return id?.trim() ?? "";
}

function normalizeFilter(
  filter: CustomerMeterSummaryFilter,
): CustomerMeterSummaryFilter {
  if (filter.mode === "estate") {
    return { mode: "estate", estateId: normalizeId(filter.estateId) };
  }
  return { mode: "company", companyId: normalizeId(filter.companyId) };
}

function argMatchesFilter(
  arg: GetCustomerMeterSummaryArgs | undefined,
  filter: CustomerMeterSummaryFilter,
): boolean {
  const estateId = normalizeId(arg?.estateId);
  const companyId = normalizeId(arg?.companyId);

  if (filter.mode === "estate") {
    if (!filter.estateId) return !estateId && !companyId;
    return estateId === filter.estateId && !companyId;
  }
  if (!filter.companyId) return !estateId && !companyId;
  return companyId === filter.companyId && !estateId;
}

const customerMeterSummarySlice = createSlice({
  name: "superAdminCustomerMeterSummary",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<CustomerMeterSummaryFilter>) => {
      state.filter = normalizeFilter(action.payload);
    },
    clearCustomerMeterSummary: (state) => {
      state.filter = { mode: "estate", estateId: "" };
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomerMeterSummary.pending, (state, action) => {
        if (!argMatchesFilter(action.meta.arg, state.filter)) return;
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCustomerMeterSummary.fulfilled, (state, action) => {
        if (!argMatchesFilter(action.meta.arg, state.filter)) return;
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getCustomerMeterSummary.rejected, (state, action) => {
        if (!argMatchesFilter(action.meta.arg, state.filter)) return;
        state.status = "failed";
        state.error =
          action.payload?.message ||
          action.error.message ||
          "Failed to fetch customer & meter summary";
      });
  },
});

export const { setFilter, clearCustomerMeterSummary } =
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

export const selectCustomerMeterSummaryFilter = (
  state: RootState,
): CustomerMeterSummaryFilter => state.superAdminCustomerMeterSummary.filter;

export const selectCustomerMeterSummaryStatus = (
  state: RootState,
): CustomerMeterSummaryState["status"] =>
  state.superAdminCustomerMeterSummary.status;

export default customerMeterSummarySlice.reducer;
