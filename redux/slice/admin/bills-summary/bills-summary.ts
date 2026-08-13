import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { BillsSummaryResponse } from "@/types/analytics";
import {
  apiErrorRejectValue,
  type ApiErrorRejectValue,
} from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";

/** GET /analytics/bills/summary?estateId= */
export const getBillsSummary = createAsyncThunk<
  BillsSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>("admin-bills-summary/get", async ({ estateId }, { rejectWithValue }) => {
  const id = extractEstateId(estateId);
  if (!id) {
    return rejectWithValue({ message: "Invalid estate ID." });
  }
  try {
    const res = await axiosInstance.get<BillsSummaryResponse>(
      "/analytics/bills/summary",
      { params: { estateId: id } },
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});
