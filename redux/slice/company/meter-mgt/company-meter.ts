import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";

interface CompanyMeterEstatePayload {
  meterNumber: string;
  estateId: string;
}

/** Payload for POST /api/v1/meters/assign-meter-to-address — estate pool, address, or unassign */
export interface AssignCompanyMeterPayload {
  meterNumber: string;
  estateId: string;
  addressId?: string;
  unassign?: boolean;
  companyId?: string;
}

/** Payload for POST /api/v1/meters/add-meter — company pool, estate, or both */
export interface CompanyAddMeterPayload {
  meterNumber: string;
  companyId: string;
  estateId?: string;
  userId?: string;
  addressId?: string;
  newEstateId?: string;
}

export const addCompanyMeter = createAsyncThunk(
  "company-meter/addMeter",
  async (data: CompanyAddMeterPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/add-meter", data);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const removeCompanyEstateMeter = createAsyncThunk(
  "company-meter/removeEstateMeter",
  async (data: CompanyMeterEstatePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        "/api/v1/meters/remove-estate-meter",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/**
 * POST /api/v1/meters/assign-meter-to-address
 * Assign: estateId alone (estate pool) or + addressId (bind address).
 * Unassign: unassign=true clears address; meter stays on estate.
 */
export const assignCompanyMeterToEstate = createAsyncThunk(
  "company-meter/assignMeterToEstate",
  async (data: AssignCompanyMeterPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/meters/assign-meter-to-address",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const getCompanyMeters = createAsyncThunk(
  "company-meter/getMeters",
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
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);

      const baseUrl = estateId
        ? `/api/v1/meters/estate/${estateId}`
        : "/api/v1/meters";

      const res = await axiosInstance.get(`${baseUrl}?${params.toString()}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const getCompanyMeterByAddressId = createAsyncThunk(
  "company-meter/getMeterByAddressId",
  async (addressId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/meters/address/${addressId}`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export const deleteCompanyMeter = createAsyncThunk(
  "company-meter/deleteMeter",
  async (meterId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/meters/${meterId}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
