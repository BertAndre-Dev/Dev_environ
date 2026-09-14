import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiErrorRejectValue, getApiErrorMessage } from "@/lib/api-error";
import { extractSubscriptionPlans } from "@/lib/plans";
import axiosInstance from "@/utils/axiosInstance";

export type { SubscriptionPlan } from "@/lib/plans";

/** GET /api/v1/plans */
export const getPlans = createAsyncThunk(
  "plans/getList",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/v1/plans");
      return extractSubscriptionPlans(res.data);
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to load plans.",
        },
      );
    }
  },
);
