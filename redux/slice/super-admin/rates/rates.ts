import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export type RateFeeType = "VENDING" | "BILL_PAYMENT";
export type RateScope = "GLOBAL" | "COMPANY" | "ESTATE";

export interface RateSplit {
  percent: number;
  bankCode: string;
  accountNumber: string;
  label: string;
}

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
  splits?: RateSplit[] | null;
  notes?: string | null;
  isActive?: boolean;
  source?: string | null;
  configId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface EffectiveRateEstate {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  companyId?: string | null;
  isActive?: boolean;
  modules?: string[];
  visitorVerificationMode?: string;
}

export interface EffectiveRateResolved {
  scope?: RateScope | string;
  feeType?: RateFeeType | string;
  estateId?: string | null;
  companyId?: string | null;
  splits?: RateSplit[] | null;
  source?: string | null;
  configId?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface EffectiveRateData {
  estate?: EffectiveRateEstate | null;
  feeType?: RateFeeType | string;
  resolved?: EffectiveRateResolved | null;
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

export interface UpsertRatePayload {
  scope: RateScope;
  feeType: RateFeeType;
  estateId?: string;
  companyId?: string;
  splits: RateSplit[];
  notes?: string;
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
  if (
    record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  ) {
    return record.data as PlatformRate;
  }
  if ("feeType" in record || "scope" in record || "id" in record) {
    return record as PlatformRate;
  }
  return null;
}

/** Parse GET /rates/effective — `{ data: { estate, feeType, resolved } }` */
function parseEffectiveRate(payload: unknown): EffectiveRateData | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;

  if (!("resolved" in data) && !("estate" in data) && !("feeType" in data)) {
    return null;
  }

  const resolvedRaw = data.resolved;
  const resolved =
    resolvedRaw && typeof resolvedRaw === "object" && !Array.isArray(resolvedRaw)
      ? (resolvedRaw as EffectiveRateResolved)
      : null;

  const estateRaw = data.estate;
  const estate =
    estateRaw && typeof estateRaw === "object" && !Array.isArray(estateRaw)
      ? (estateRaw as EffectiveRateEstate)
      : null;

  return {
    estate,
    feeType:
      (data.feeType as string | undefined) ?? resolved?.feeType ?? undefined,
    resolved,
  };
}

/** Prefer estate-scoped config splits; fall back to effective resolved rate. */
export function pickEditableRate(args: {
  estateRates: PlatformRate[];
  effective: EffectiveRateData | null;
}): { splits: RateSplit[]; notes: string } {
  const { estateRates, effective } = args;
  const estateRate =
    estateRates.find((rate) => rate.isActive !== false) ?? estateRates[0];

  if (Array.isArray(estateRate?.splits) && estateRate.splits.length > 0) {
    return {
      splits: estateRate.splits,
      notes: String(estateRate.notes ?? ""),
    };
  }

  const resolved = effective?.resolved;
  if (resolved && Array.isArray(resolved.splits) && resolved.splits.length > 0) {
    return {
      splits: resolved.splits,
      notes: String(resolved.notes ?? ""),
    };
  }

  return { splits: [], notes: "" };
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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
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
        data: parseEffectiveRate(res.data),
      };
    } catch (error: unknown) {
      return rejectWithValue({
        feeType: String(params.feeType),
        message: getApiErrorMessage(error),
      });
    }
  },
);

/** PUT /api/v1/rates — create or update a platform fee rate */
export const upsertRate = createAsyncThunk(
  "superAdminRates/upsertRate",
  async (payload: UpsertRatePayload, { rejectWithValue }) => {
    try {
      const body: Record<string, unknown> = {
        scope: payload.scope,
        feeType: payload.feeType,
        splits: payload.splits,
      };
      if (payload.estateId) body.estateId = payload.estateId;
      if (payload.companyId) body.companyId = payload.companyId;
      if (payload.notes?.trim()) body.notes = payload.notes.trim();

      const res = await axiosInstance.put("/api/v1/rates", body);
      return {
        data: parseSingleRate(res.data) ?? (res.data as PlatformRate),
        message:
          (res.data as { message?: string })?.message ??
          "Rate saved successfully",
      };
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
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
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
