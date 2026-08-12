import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { AveragePurchaseValueResponse } from "@/types/analytics";
import { getApiErrorMessage } from "@/lib/api-error";

/** GET /api/v1/analytics/commercial/vending/average-purchase */
export const getAveragePurchaseValue = createAsyncThunk(
  "super-admin-average-purchase/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<AveragePurchaseValueResponse>(
        "/api/v1/analytics/commercial/vending/average-purchase",
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
