import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";

export type CompanyRevenueHead = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyRevenueHeadListResponse = {
  success?: boolean;
  message?: string;
  data?: CompanyRevenueHead[];
  pagination?: {
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
};

export const createCompanyRevenueHead = createAsyncThunk(
  "company-revenue-head/createCompanyRevenueHead",
  async (
    data: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post("/api/v1/revenue-head", data);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const fetchCompanyRevenueHeads = createAsyncThunk(
  "company-revenue-head/fetchCompanyRevenueHeads",
  async (
    {
      estateId,
      page = 1,
      limit = 12,
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
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("estateId", estateId);
      params.set("id", estateId);

      const qs = params.toString();
      const res = await axiosInstance.get(
        `/api/v1/revenue-head/estate/${estateId}${qs ? "?" + qs : ""}`,
      );
      return res.data as CompanyRevenueHeadListResponse;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const fetchCompanyRevenueHeadById = createAsyncThunk(
  "company-revenue-head/fetchCompanyRevenueHeadById",
  async (id: string, { rejectWithValue }) => {
    try {
      try {
        const res = await axiosInstance.get(`/api/v1/revenue-head/${id}`, {
          params: { id },
        });
        return res.data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status !== 404 && status !== 500) throw err;
      }

      const res2 = await axiosInstance.get(`/api/v1/revenue-head`, {
        params: { id },
      });
      return res2.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const updateCompanyRevenueHead = createAsyncThunk(
  "company-revenue-head/updateCompanyRevenueHead",
  async (
    {
      id,
      name,
      description,
    }: { id: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(`/api/v1/revenue-head/${id}`, {
        name,
        description,
      });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const deleteCompanyRevenueHead = createAsyncThunk(
  "company-revenue-head/deleteCompanyRevenueHead",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/revenue-head/${id}`, {
        params: { id },
      });
      return res.data ? { id, ...res.data } : { id };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
