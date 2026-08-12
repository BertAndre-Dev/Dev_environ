import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
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
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
