import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  mapVendAnalyticsToEnergyConsumption,
  type EnergyConsumptionDataPoint,
  type EnergyConsumptionPeriod,
  type VendAnalyticsChartResponse,
} from "@/lib/energy-consumption-chart";

interface VendData {
  meterNumber: string;
  amount: number;
  walletId: string;
}

interface ResidentMeterData {
  meterNumber: string;
}

/** POST /api/v1/meters/tariff — body: { meterNumber: string } */
export const getMeterTariff = createAsyncThunk(
  "meter-mgt/getMeterTariff",
  async ({ meterNumber }: { meterNumber: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/tariff", {
        meterNumber,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const getMeterByAddress = createAsyncThunk(
  "meter-mgt/getMeterByAddress",
  async ({ addressId }: { addressId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/meters/address/${addressId}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const vendPower = createAsyncThunk(
  "meter-mgt/vendPower",
  async (data: VendData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/meters/vend", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);
export const disconnectMeter = createAsyncThunk(
  "meter-mgt/disconnectMeter",
  async (data: ResidentMeterData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/iec/meter/disconnect", {
        meterNumber: data.meterNumber,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export const reconnectMeter = createAsyncThunk(
  "meter-mgt/reconnectMeter",
  async (data: ResidentMeterData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/iec/meter/reconnect", {
        meterNumber: data.meterNumber,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);

export type MeterUsageRange =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | (string & {});

export interface MeterUsagePoint {
  time: string;
  usageKwh: number;
}

export interface MeterUsageData {
  meterNumber: string;
  range: string;
  source?: string | null;
  unit?: string;
  onlineStatus?: number | null;
  totalUsage: number;
  from?: string;
  to?: string;
  currentReading?: number;
  points: MeterUsagePoint[];
  hint?: string;
}

export interface MeterUsageResponse {
  success: boolean;
  message: string;
  data: MeterUsageData;
}

/** Backend may return 4xx/5xx with a structured body when usage history is empty. */
function parseMeterUsageResponse(value: unknown): MeterUsageResponse | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const data = record.data;
  if (!data || typeof data !== "object") return null;
  const meterData = data as Record<string, unknown>;
  if (
    typeof meterData.meterNumber !== "string" ||
    !Array.isArray(meterData.points)
  ) {
    return null;
  }

  return {
    success: Boolean(record.success),
    message:
      typeof record.message === "string"
        ? record.message
        : "Meter usage response",
    data: {
      meterNumber: meterData.meterNumber,
      range: typeof meterData.range === "string" ? meterData.range : "",
      source:
        typeof meterData.source === "string" ? meterData.source : undefined,
      unit: typeof meterData.unit === "string" ? meterData.unit : undefined,
      onlineStatus:
        typeof meterData.onlineStatus === "number"
          ? meterData.onlineStatus
          : undefined,
      totalUsage: Number(meterData.totalUsage) || 0,
      from: typeof meterData.from === "string" ? meterData.from : undefined,
      to: typeof meterData.to === "string" ? meterData.to : undefined,
      currentReading:
        typeof meterData.currentReading === "number"
          ? meterData.currentReading
          : undefined,
      points: meterData.points.map((point) => {
        const p = point as Record<string, unknown>;
        return {
          time: typeof p.time === "string" ? p.time : "",
          usageKwh: Number(p.usageKwh) || 0,
        };
      }),
      hint: typeof meterData.hint === "string" ? meterData.hint : undefined,
    },
  };
}

/** GET /api/v1/meters/usage/{meterNumber}?range=&refresh= */
export const getMeterUsage = createAsyncThunk(
  "meter-mgt/getMeterUsage",
  async (
    {
      meterNumber,
      range = "daily",
      refresh,
    }: {
      meterNumber: string;
      range?: MeterUsageRange;
      refresh?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: Record<string, string> = { range };
      if (refresh) {
        params.refresh = "true";
      }
      const res = await axiosInstance.get<MeterUsageResponse>(
        `/api/v1/meters/usage/${encodeURIComponent(meterNumber)}`,
        {
          params,
          // API returns 500 with a JSON body when no history exists (Swagger shows this too).
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status === 500,
        },
      );

      const parsed =
        parseMeterUsageResponse(res.data) ??
        parseMeterUsageResponse(
          (res.data as { data?: unknown } | undefined)?.data,
        );
      if (parsed) return parsed;

      return rejectWithValue({
        message: "Unexpected meter usage response.",
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: unknown; status?: number };
      };
      const parsed = parseMeterUsageResponse(err?.response?.data);
      if (parsed) return parsed;

      const message =
        err?.response?.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof (err.response.data as { message?: string }).message === "string"
          ? (err.response.data as { message: string }).message
          : "Failed to fetch meter usage.";

      return rejectWithValue({ message });
    }
  },
);

export interface VendingStatsByAddressData {
  totalVends: number;
  totalAmount: number;
  averageAmount: number;
  maxAmount: number;
  minAmount: number;
}

export interface VendingStatsByAddressResponse {
  success: boolean;
  message: string;
  data: VendingStatsByAddressData;
}

/** GET /analytics/meters/vending/by-address?addressId= */
export const getVendingStatsByAddress = createAsyncThunk(
  "meter-mgt/getVendingStatsByAddress",
  async ({ addressId }: { addressId: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get<VendingStatsByAddressResponse>(
        "/analytics/meters/vending/by-address",
        { params: { addressId } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch vending statistics.",
      });
    }
  },
);

export type { VendAnalyticsChartResponse };

/** GET /api/v1/meters/estate/{estateId}/vend-analytics/chart */
export const getEstateVendAnalyticsChart = createAsyncThunk(
  "meter-mgt/getEstateVendAnalyticsChart",
  async (
    {
      estateId,
      addressId,
      period = "weekly",
      metric,
    }: {
      estateId: string;
      addressId: string;
      period?: EnergyConsumptionPeriod;
      metric: "value" | "unit";
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get<VendAnalyticsChartResponse>(
        `/api/v1/meters/estate/${estateId}/vend-analytics/chart`,
        { params: { period, metric, addressId } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch vend analytics chart.",
      });
    }
  },
);

/** Fetches amount + units series and merges for the energy consumption chart. */
export const getResidentEnergyConsumptionChart = createAsyncThunk(
  "meter-mgt/getResidentEnergyConsumptionChart",
  async (
    {
      estateId,
      addressId,
      period = "weekly",
    }: {
      estateId: string;
      addressId: string;
      period?: EnergyConsumptionPeriod;
    },
    { rejectWithValue },
  ) => {
    try {
      const [amountRes, unitsRes] = await Promise.all([
        axiosInstance.get<VendAnalyticsChartResponse>(
          `/api/v1/meters/estate/${estateId}/vend-analytics/chart`,
          { params: { period, metric: "value", addressId } },
        ),
        axiosInstance.get<VendAnalyticsChartResponse>(
          `/api/v1/meters/estate/${estateId}/vend-analytics/chart`,
          { params: { period, metric: "unit", addressId } },
        ),
      ]);

      return mapVendAnalyticsToEnergyConsumption(
        amountRes.data,
        unitsRes.data,
        addressId,
      ) satisfies EnergyConsumptionDataPoint[];
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch energy consumption chart.",
      });
    }
  },
);

export const getMeterVendHistory = createAsyncThunk(
  "meter-mgt/getMeterVendHistory",
  async (
    {
      meterNumber,
      page = 1,
      limit = 10,
    }: { meterNumber: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/meters/vend-history/${meterNumber}?page=${page}&limit=${limit}`,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message || "Failed to fetch vend history",
      });
    }
  },
);
