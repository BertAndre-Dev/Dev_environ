import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { MeterSummaryResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";

/** GET /analytics/meters/summary?estateId= */
export const getMeterSummary = createAsyncThunk<
  MeterSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>("staff-meter-summary/get", async ({ estateId }, { rejectWithValue }) => {
  const id = extractEstateId(estateId);
  if (!id) {
    return rejectWithValue({ message: "Invalid estate ID." });
  }
  try {
    const res = await axiosInstance.get<MeterSummaryResponse>(
      "/analytics/meters/summary",
      { params: { estateId: id } },
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});
