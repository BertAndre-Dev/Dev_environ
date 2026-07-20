import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type GetBillsByEstateParams = {
  estateId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

/** GET /api/v1/bills-mgt/bills/{estateId} — all bills for an estate */
export const getBillsByEstate = createAsyncThunk(
  "super-admin-bills/getBillsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: GetBillsByEstateParams,
    { rejectWithValue },
  ) => {
    try {
      const estateIdValue = String(estateId || "").trim();
      if (!estateIdValue) {
        return rejectWithValue({ message: "Please select a valid estate." });
      }

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/bills/${estateIdValue}?${params.toString()}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch bills",
      });
    }
  },
);
