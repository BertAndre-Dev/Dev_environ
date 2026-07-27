import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type {
  RechargeBehaviorBucket,
  RechargeBehaviorResponse,
} from "@/types/analytics";

/** GET /api/v1/analytics/commercial/recharge-behavior?bucket=daily|weekly|monthly */
export const getRechargeBehavior = createAsyncThunk(
  "super-admin-recharge-behavior/get",
  async (
    { bucket }: { bucket: RechargeBehaviorBucket },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<RechargeBehaviorResponse>(
        "/api/v1/analytics/commercial/recharge-behavior",
        { params: { bucket } },
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
          "Failed to fetch recharge behavior.",
      });
    }
  },
);
