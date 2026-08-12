import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerActivationsResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/customers/activations */
export const getCustomerActivations = createAsyncThunk<
  CustomerActivationsResponse,
  void,
  { rejectValue: ApiErrorRejectValue }
>("super-admin-customer-activations/get", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<CustomerActivationsResponse>(
      "/api/v1/analytics/commercial/customers/activations",
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});
