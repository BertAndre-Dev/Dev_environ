import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerGrowthResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/customers/growth */
export const getCustomerGrowth = createAsyncThunk(
  "super-admin-customer-growth/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<CustomerGrowthResponse>(
        "/api/v1/analytics/commercial/customers/growth",
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
