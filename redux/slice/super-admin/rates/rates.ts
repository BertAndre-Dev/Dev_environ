import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type RateFeeType = "VENDING" | "BILL_PAYMENT";
export type RateScope = "GLOBAL" | "COMPANY" | "ESTATE";

export interface PlatformRate {
  id?: string;
  feeType?: RateFeeType | string;
  scope?: RateScope | string;
  estateId?: string | null;
  companyId?: string | null;
  /** Common fee value fields — API may use one or more of these. */
  rate?: number | null;
  percentage?: number | null;
  feePercent?: number | null;
  percent?: number | null;
  fixedAmount?: number | null;
  amount?: number | null;
  feeAmount?: number | null;
  currency?: string | null;
  calculationType?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface GetRatesParams {
  feeType?: RateFeeType | string;
  scope?: RateScope | string;
  estateId?: string;
  companyId?: string;
}

export interface GetEffectiveRateParams {
  estateId: string;
  feeType: RateFeeType | string;
}

function parseRatesPayload(payload: unknown): PlatformRate[] {
  if (Array.isArray(payload)) {
    return payload as PlatformRate[];
  }
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) {
    return record.data as PlatformRate[];
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const rates = (nested as Record<string, unknown>).rates;
    if (Array.isArray(rates)) return rates as PlatformRate[];
  }

  if (Array.isArray(record.rates)) {
    return record.rates as PlatformRate[];
  }

  return [];
}

function parseSingleRate(payload: unknown): PlatformRate | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return record.data as PlatformRate;
  }
  if ("feeType" in record || "scope" in record || "id" in record) {
    return record as PlatformRate;
  }
  return null;
}

/** GET /api/v1/rates — list platform fee rate configurations */
export const getRates = createAsyncThunk(
  "superAdminRates/getRates",
  async (params: GetRatesParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.feeType) query.set("feeType", String(params.feeType));
      if (params.scope) query.set("scope", String(params.scope));
      if (params.estateId) query.set("estateId", params.estateId);
      if (params.companyId) query.set("companyId", params.companyId);
      const suffix = query.toString() ? `?${query.toString()}` : "";
      const res = await axiosInstance.get(`/api/v1/rates${suffix}`);
      return {
        data: parseRatesPayload(res.data),
        params,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch platform rates",
      });
    }
  },
);

/** GET /api/v1/rates/effective — resolve effective rate for an estate */
export const getEffectiveRate = createAsyncThunk(
  "superAdminRates/getEffectiveRate",
  async (params: GetEffectiveRateParams, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        estateId: params.estateId,
        feeType: String(params.feeType),
      });
      const res = await axiosInstance.get(
        `/api/v1/rates/effective?${query.toString()}`,
      );
      return {
        feeType: String(params.feeType),
        data: parseSingleRate(res.data),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        feeType: String(params.feeType),
        message:
          err?.response?.data?.message ?? "Failed to fetch effective rate",
      });
    }
  },
);

/** Deactivate a rate configuration — /api/v1/rates/{id} */
export const deactivateRate = createAsyncThunk(
  "superAdminRates/deactivateRate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/rates/${id}`);
      return { id, data: res.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to deactivate rate",
      });
    }
  },
);
