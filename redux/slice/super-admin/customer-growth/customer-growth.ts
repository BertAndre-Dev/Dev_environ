import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerGrowthResponse } from "@/types/analytics";

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
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch customer growth.",
      });
    }
  },
);
