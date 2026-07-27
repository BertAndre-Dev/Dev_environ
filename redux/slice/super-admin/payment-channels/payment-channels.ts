import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { PaymentChannelsResponse } from "@/types/analytics";

/** GET /api/v1/analytics/finance/payment-channels */
export const getPaymentChannels = createAsyncThunk(
  "super-admin-payment-channels/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<PaymentChannelsResponse>(
        "/api/v1/analytics/finance/payment-channels",
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
          "Failed to fetch payment channels.",
      });
    }
  },
);
