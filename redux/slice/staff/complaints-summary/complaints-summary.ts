import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { ComplaintsSummaryResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";

/** GET /analytics/complaints/summary?estateId= */
export const getComplaintsSummary = createAsyncThunk<
  ComplaintsSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>("staff-complaints-summary/get", async ({ estateId }, { rejectWithValue }) => {
  const id = extractEstateId(estateId);
  if (!id) {
    return rejectWithValue({ message: "Invalid estate ID." });
  }
  try {
    const res = await axiosInstance.get<ComplaintsSummaryResponse>(
      "/analytics/complaints/summary",
      { params: { estateId: id } },
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});
