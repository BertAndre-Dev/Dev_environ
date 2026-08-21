import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { toEstateWriteBody } from "@/lib/plans";

export enum VisitorVerificationMode {
  VIEW_AND_VERIFY = "VIEW_AND_VERIFY",
  VERIFY_ONLY = "VERIFY_ONLY",
  VIEW_ONLY = "VIEW_ONLY",
}

export interface EstateData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive?: boolean;
  modules?: string[];
  plan?: string;
  minVendAmount?: number;
  maxVendAmount?: number;
  visitorVerificationMode?: VisitorVerificationMode;
}

export type GetEstatesParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
};

/** POST /api/v1/estate-mgt */
export const createEnergyProviderEstate = createAsyncThunk(
  "energy-provider-estate/createEnergyProviderEstate",
  async (data: EstateData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/estate-mgt",
        toEstateWriteBody(data),
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to create estate",
      });
    }
  },
);

/** GET /api/v1/estate-mgt */
export const getEnergyProviderEstates = createAsyncThunk(
  "energy-provider-estate/getEnergyProviderEstates",
  async (params: GetEstatesParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search, startDate, endDate } = params ?? {};
      const query = new URLSearchParams();
      if (page != null) query.set("page", String(page));
      if (limit != null) query.set("limit", String(limit));
      if (search?.trim()) query.set("search", search.trim());
      if (startDate) query.set("startDate", startDate);
      if (endDate) query.set("endDate", endDate);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await axiosInstance.get(`/api/v1/estate-mgt${suffix}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch estates",
      });
    }
  },
);

/** GET /api/v1/estate-mgt/{id} */
export const getEnergyProviderEstateById = createAsyncThunk(
  "energy-provider-estate/getEnergyProviderEstateById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/estate-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to fetch estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id} */
export const updateEnergyProviderEstate = createAsyncThunk(
  "energy-provider-estate/updateEnergyProviderEstate",
  async (
    { id, data }: { id: string; data: EstateData },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}`,
        toEstateWriteBody(data),
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to update estate",
      });
    }
  },
);

/** DELETE /api/v1/estate-mgt/{id} */
export const deleteEnergyProviderEstate = createAsyncThunk(
  "energy-provider-estate/deleteEnergyProviderEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/estate-mgt/${id}`);
      return { ...(res.data as object), deletedId: id };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to delete estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id}/suspend-estate */
export const suspendEnergyProviderEstate = createAsyncThunk(
  "energy-provider-estate/suspendEnergyProviderEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}/suspend-estate`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to suspend estate",
      });
    }
  },
);

/** PUT /api/v1/estate-mgt/{id}/activate-estate */
export const activateEnergyProviderEstate = createAsyncThunk(
  "energy-provider-estate/activateEnergyProviderEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}/activate-estate`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message: err?.response?.data?.message ?? "Failed to activate estate",
      });
    }
  },
);
