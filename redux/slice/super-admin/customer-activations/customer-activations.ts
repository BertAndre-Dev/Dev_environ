import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerActivationsResponse } from "@/types/analytics";

/** GET /api/v1/analytics/commercial/customers/activations */
export const getCustomerActivations = createAsyncThunk<
  CustomerActivationsResponse,
  void,
  { rejectValue: { message: string } }
>("super-admin-customer-activations/get", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<CustomerActivationsResponse>(
      "/api/v1/analytics/commercial/customers/activations",
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
        "Failed to fetch customer activations.",
    });
  }
});
