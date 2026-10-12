import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { CompanyGenerateFinancialReportData } from "@/types/analytics";
import { getCompanyOverviewFinancialReport } from "./overview-financial-report";

export interface OverviewFinancialReportState {
  report: CompanyGenerateFinancialReportData | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: OverviewFinancialReportState = {
  report: null,
  status: "idle",
  error: null,
};

const overviewFinancialReportSlice = createSlice({
  name: "companyOverviewFinancialReport",
  initialState,
  reducers: {
    clearOverviewFinancialReport: (state) => {
      state.report = null;
      state.status = "idle";
      state.error = null;
    },
    resetOverviewFinancialReportError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyOverviewFinancialReport.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyOverviewFinancialReport.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.report = action.payload?.data ?? null;
        state.error = null;
      })
      .addCase(getCompanyOverviewFinancialReport.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const {
  clearOverviewFinancialReport,
  resetOverviewFinancialReportError,
} = overviewFinancialReportSlice.actions;

export default overviewFinancialReportSlice.reducer;

export const selectFinancialReport = (
  state: RootState,
): CompanyGenerateFinancialReportData | null =>
  state.companyOverviewFinancialReport.report;

export const selectFinancialReportLoading = (state: RootState): boolean =>
  state.companyOverviewFinancialReport.status === "isLoading";

export const selectFinancialReportError = (state: RootState): string | null =>
  state.companyOverviewFinancialReport.error;

export const selectFinancialReportStatus = (
  state: RootState,
): OverviewFinancialReportState["status"] =>
  state.companyOverviewFinancialReport.status;
