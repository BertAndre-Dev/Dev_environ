import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { CustomerGrowthResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
