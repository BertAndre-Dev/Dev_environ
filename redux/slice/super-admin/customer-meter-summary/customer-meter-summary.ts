import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerMeterSummaryResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";

export type GetCustomerMeterSummaryArgs = {
  estateId?: string;
  companyId?: string;
};

export type CustomerMeterSummaryFilter =
  | { mode: "estate"; estateId: string }
  | { mode: "company"; companyId: string };

/** Map filter to mutually exclusive query args. Returns undefined until an id is set. */
export function filterToSummaryArgs(
  filter: CustomerMeterSummaryFilter,
): GetCustomerMeterSummaryArgs | undefined {
  if (filter.mode === "estate") {
    const estateId = filter.estateId.trim();
    return estateId ? { estateId } : undefined;
  }
  const companyId = filter.companyId.trim();
  return companyId ? { companyId } : undefined;
}

/** GET /api/v1/analytics/commercial/customers/summary */
export const getCustomerMeterSummary = createAsyncThunk<
  CustomerMeterSummaryResponse,
  GetCustomerMeterSummaryArgs | undefined,
  { rejectValue: ApiErrorRejectValue }
>(
  "super-admin-customer-meter-summary/get",
  async (args, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {};
      const estateId = args?.estateId?.trim();
      const companyId = args?.companyId?.trim();
      if (estateId) {
        params.estateId = estateId;
      } else if (companyId) {
        params.companyId = companyId;
      }

      const res = await axiosInstance.get<CustomerMeterSummaryResponse>(
        "/api/v1/analytics/commercial/customers/summary",
        { params: Object.keys(params).length ? params : undefined },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
