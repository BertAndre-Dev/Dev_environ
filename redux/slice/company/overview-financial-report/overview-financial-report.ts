import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import type {
  CompanyGenerateFinancialReportQueryParams,
  CompanyGenerateFinancialReportResponse,
} from "@/types/analytics";

/** GET /api/v1/financial-report/company/generate */
export const getCompanyOverviewFinancialReport = createAsyncThunk<
  CompanyGenerateFinancialReportResponse,
  CompanyGenerateFinancialReportQueryParams,
  { rejectValue: ReturnType<typeof apiErrorRejectValue> }
>(
  "company-overview-financial-report/get",
  async (params, { rejectWithValue }) => {
    try {
      const query: Record<string, string> = {
        companyId: params.companyId,
      };
      if (params.estateId) query.estateId = params.estateId;
      if (params.startDate) query.startDate = params.startDate;
      if (params.endDate) query.endDate = params.endDate;

      const res = await axiosInstance.get<CompanyGenerateFinancialReportResponse>(
        "/api/v1/financial-report/company/generate",
        { params: query },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
