import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { VendingFrequencyResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/vending/frequency */
export const getVendingFrequency = createAsyncThunk(
  "super-admin-vending-frequency/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<VendingFrequencyResponse>(
        "/api/v1/analytics/commercial/vending/frequency",
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
