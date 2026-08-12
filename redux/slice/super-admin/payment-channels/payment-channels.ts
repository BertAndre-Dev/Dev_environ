import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { PaymentChannelsResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
