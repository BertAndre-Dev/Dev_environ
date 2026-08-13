import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";
import type { UserSummaryResponse } from "@/redux/slice/admin/user-analytics/user-analytics";

/** GET /api/v1/user-analytics/summary?estateId= */
export const getEstateAdminUserSummary = createAsyncThunk<
  UserSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "estate-admin-user-analytics/getUserSummary",
  async ({ estateId }, { rejectWithValue }) => {
    const id = extractEstateId(estateId);
    if (!id) {
      return rejectWithValue({ message: "Invalid estate ID." });
    }
    try {
      const res = await axiosInstance.get<UserSummaryResponse>(
        "/api/v1/user-analytics/summary",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
