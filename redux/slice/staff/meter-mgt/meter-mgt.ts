import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ClearTamperTokenResponse } from "@/lib/clear-tamper-token";

export type {
  ClearTamperTokenData,
  ClearTamperTokenResponse,
} from "@/lib/clear-tamper-token";
export { extractClearTamperToken } from "@/lib/clear-tamper-token";


export interface AssignMeterPayload {
    meterNumber: string;
    estateId: string;
    addressId?: string;
    unassign?: boolean;
}

export const assignMeterToAddress = createAsyncThunk(
    "staff-meter/assignMeterToAddress",
    async (data: AssignMeterPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post("/api/v1/meters/assign-meter-to-address", data);
            return res.data;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to assign or unassign meter.",
            });
        }
    }
);


export const getAllEstateMeter = createAsyncThunk(
    "staff-meter-mgt/getAllEstateMeter",
    async (
        {
            estateId,
            page = 1,
            limit = 10,
            search = ""
        }: { estateId: string; page?: number; limit?: number; search?: string;},
        { rejectWithValue }
    ) => {
        try {

            const params = new URLSearchParams();

            params.append("page", String(page));
            params.append("limit", String(limit));

            if (search) {
                params.append("search", search);
            }
            const res = await axiosInstance.get(
                `/api/v1/meters/estate/${estateId}?${params.toString()}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data);
        }
    }
);


export const getMeter = createAsyncThunk(
    "staff-meter/getMeter",
    async (meterId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/v1/meters/${meterId}`);
            return res.data;
        } catch (error: unknown) {
            const data = (error as { response?: { data?: unknown } })?.response?.data;
            if (data && typeof data === "object") return rejectWithValue(data);
            return rejectWithValue({
                message: getApiErrorMessage(error) ?? "Failed to fetch meter",
            });
        }
    }
);

export interface VendingStatsByEstateData {
  totalVends: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
  uniqueMeters: number;
}

export interface VendingStatsByEstateResponse {
  success: boolean;
  message: string;
  data: VendingStatsByEstateData;
}

/** GET /analytics/meters/vending/by-estate?estateId= */
export const getVendingStatsByEstate = createAsyncThunk(
  "staff-meter-mgt/getVendingStatsByEstate",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<VendingStatsByEstateResponse>(
        "/analytics/meters/vending/by-estate",
        { params: { estateId } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch vending statistics.",
      });
    }
  },
);

export interface EstateVendLimitsDefaults {
  minVendAmount: number;
  maxVendAmount: number;
  monthlyVendUnitCap?: number | null;
}

export interface EstateVendLimitsData {
  estateId: string;
  estateName: string;
  minVendAmount: number;
  maxVendAmount: number;
  monthlyVendUnitCap?: number | null;
  isConfigured: boolean;
  defaults: EstateVendLimitsDefaults;
}

export interface EstateVendLimitsResponse {
  success: boolean;
  message: string;
  data: EstateVendLimitsData;
}

/** GET /api/v1/meters/estate/{estateId}/vend-limits */
export const getEstateVendLimits = createAsyncThunk(
  "staff-meter-mgt/getEstateVendLimits",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<EstateVendLimitsResponse>(
        `/api/v1/meters/estate/${estateId}/vend-limits`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return rejectWithValue(err?.response?.data);
    }
  },
);

/** PUT /api/v1/meters/estate/{estateId}/vend-limits */
export const setEstateVendLimits = createAsyncThunk(
  "staff-meter-mgt/setEstateVendLimits",
  async (
    {
      estateId,
      minVendAmount,
      maxVendAmount,
      monthlyVendUnitCap,
    }: {
      estateId: string;
      minVendAmount: number;
      maxVendAmount: number;
      monthlyVendUnitCap: number | null;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put<EstateVendLimitsResponse>(
        `/api/v1/meters/estate/${estateId}/vend-limits`,
        { minVendAmount, maxVendAmount, monthlyVendUnitCap },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return rejectWithValue(err?.response?.data);
    }
  },
);

/** POST /api/v1/meters/clear-tamper-token — body: { meterNumber } */
export const clearTamperToken = createAsyncThunk(
  "staff-meter-mgt/clearTamperToken",
  async ({ meterNumber }: { meterNumber: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post<ClearTamperTokenResponse>(
        "/api/v1/meters/clear-tamper-token",
        { meterNumber },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return rejectWithValue(err?.response?.data);
    }
  },
);

