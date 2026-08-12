import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { PaymentChannelsResponse } from "@/types/analytics";
import { apiErrorRejectValue } from "@/lib/api-error";

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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
