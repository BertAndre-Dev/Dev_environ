import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerMeterSummaryResponse } from "@/types/analytics";

export type GetCustomerMeterSummaryArgs = {
  estateId?: string;
  companyId?: string;
};

/** GET /api/v1/analytics/commercial/customers/summary */
export const getCustomerMeterSummary = createAsyncThunk<
  CustomerMeterSummaryResponse,
  GetCustomerMeterSummaryArgs | undefined,
  { rejectValue: { message: string } }
>(
  "super-admin-customer-meter-summary/get",
  async (args, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      if (args?.estateId) params.estateId = args.estateId;
      if (args?.companyId) params.companyId = args.companyId;

      const res = await axiosInstance.get<CustomerMeterSummaryResponse>(
        "/api/v1/analytics/commercial/customers/summary",
        { params: Object.keys(params).length ? params : undefined },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch customer & meter summary.",
      });
    }
  },
);
