import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import type {
  PlatformFeeQueryParams,
  PlatformFeeResponse,
} from "@/types/analytics";

function toRequestParams(
  params: PlatformFeeQueryParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    startDate: params.startDate,
    endDate: params.endDate,
  };
  const estateId = params.estateId?.trim();
  const companyId = params.companyId?.trim();
  if (estateId) query.estateId = estateId;
  if (companyId) query.companyId = companyId;
  if (params.page != null) query.page = params.page;
  if (params.limit != null) query.limit = Math.min(params.limit, 50);
  return query;
}

/** GET /api/v1/analytics/finance/platform-fees */
export const getPlatformFeeAnalytics = createAsyncThunk(
  "super-admin-platform-fees/get",
  async (params: PlatformFeeQueryParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<PlatformFeeResponse>(
        "/api/v1/analytics/finance/platform-fees",
        { params: toRequestParams(params) },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
