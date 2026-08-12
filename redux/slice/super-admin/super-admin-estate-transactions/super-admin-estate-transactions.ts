import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export const getSuperAdminEstateTransactionHistory = createAsyncThunk(
  "super-admin-estate-transactions/getSuperAdminEstateTransactionHistory",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      type,
      paymentStatus,
      search,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      type?: string;
      paymentStatus?: string;
      search?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string | number> = {
        estateId,
        page,
        limit,
      };

      if (type) params.type = type;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search?.trim()) params.search = search.trim();

      const res = await axiosInstance.get(
        "/api/v1/transaction-mgt/estate-history",
        { params },
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const getSuperAdminEstateVends = createAsyncThunk(
  "super-admin-estate-transactions/getSuperAdminEstateVends",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? `?${query}` : "";
      const res = await axiosInstance.get(
        `/api/v1/meters/estate/${estateId}/vends${suffix}`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

export const getSuperAdminEstatePaidBills = createAsyncThunk(
  "super-admin-estate-transactions/getSuperAdminEstatePaidBills",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      estateId: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? `?${query}` : "";
      const res = await axiosInstance.get(
        `/api/v1/bills-mgt/paid/${estateId}${suffix}`,
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
