import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { ClearTamperTokenResponse } from "@/lib/clear-tamper-token";
import { apiErrorRejectValue } from "@/lib/api-error";

export type {
  ClearTamperTokenData,
  ClearTamperTokenResponse,
} from "@/lib/clear-tamper-token";
export { extractClearTamperToken } from "@/lib/clear-tamper-token";


interface SuperAdminMeterData {
    meterNumber: string;
    estateId: string;
};

/** Payload for POST /api/v1/meters/add-meter — company pool, estate, or both */
export interface AddMeterPayload {
    meterNumber: string;
    companyId?: string;
    estateId?: string;
    userId?: string;
    addressId?: string;
    newEstateId?: string;
}

export const assignMeterToEstate = createAsyncThunk(
  "super-admin-meter/assignMeterToEstate",
  async (data: AddMeterPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/add-meter", data);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);



export const removeEstateMeter = createAsyncThunk(
    "super-admin-meter/removeEstateMeter",
    async (data: SuperAdminMeterData, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.put("/api/v1/meters/remove-estate-meter", data);
            return res.data;
        } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
        }
    }
);


export const getAllMeters = createAsyncThunk(
  "super-admin-meter/getAllMeters",
  async (
    {
      page = 1,
      limit = 10,
      search = "",
      estateId,
    }: {
      page: number;
      limit: number;
      search?: string;
      estateId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("limit", String(limit));

      if (search) {
        params.append("search", search);
      }

      const baseUrl = estateId
        ? `/api/v1/meters/estate/${estateId}`
        : "/api/v1/meters";

      const res = await axiosInstance.get(`${baseUrl}?${params.toString()}`);

      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);



export const getMeter = createAsyncThunk(
    "super-admin-meter/getMeter",
    async (meterId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/meters/${meterId}`);
            return res.data;
        } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
        }
    }
);

/** Get a single meter by its address ID (for View details). */
export const getMeterByAddressId = createAsyncThunk(
  "super-admin-meter/getMeterByAddressId",
  async (addressId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/meters/address/${addressId}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);


export const deleteMeter = createAsyncThunk(
  "super-admin-meter/deleteMeter",
  async (meterId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/meters/${meterId}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  }
);

/** POST /api/v1/meters/clear-tamper-token — body: { meterNumber } */
export const clearTamperToken = createAsyncThunk(
  "super-admin-meter/clearTamperToken",
  async ({ meterNumber }: { meterNumber: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post<ClearTamperTokenResponse>(
        "/api/v1/meters/clear-tamper-token",
        { meterNumber },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
