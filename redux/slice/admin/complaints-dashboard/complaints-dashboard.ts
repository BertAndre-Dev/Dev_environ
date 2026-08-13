import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { ComplaintsDashboardResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";

/** GET /analytics/complaints/dashboard?estateId= */
export const getComplaintsDashboard = createAsyncThunk<
  ComplaintsDashboardResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>("admin-complaints-dashboard/get", async ({ estateId }, { rejectWithValue }) => {
  const id = extractEstateId(estateId);
  if (!id) {
    return rejectWithValue({ message: "Invalid estate ID." });
  }
  try {
    const res = await axiosInstance.get<ComplaintsDashboardResponse>(
      "/analytics/complaints/dashboard",
      { params: { estateId: id } },
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});
