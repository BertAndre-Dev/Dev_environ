import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  mapEnergyProviderConfigList,
  paginateEnergyProviderRows,
  sortEnergyProviderConfigsByCreatedAt,
  type EnergyProviderConfigRow,
} from "@/lib/energy-provider-list";

export type { EnergyProviderConfigRow };

export interface GetEnergyProviderConfigsParams {
  estateId: string;
  estateName?: string;
  page?: number;
  limit?: number;
}

export interface EnergyProviderConfigListResult {
  data: EnergyProviderConfigRow[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export interface EnergyProviderConfigPayload {
  estateId: string;
  companyId: string;
  energyProviderUserId: string;
  commissionPercent: number;
}

export interface EnergyProviderConfigResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

/** GET /api/v1/energy-provider/config?estateId= — commission configs for an estate */
export const getEnergyProviderConfigs = createAsyncThunk(
  "super-admin-energy-provider-config/getConfigs",
  async (params: GetEnergyProviderConfigsParams, { rejectWithValue }) => {
    try {
      const { estateId, estateName, page = 1, limit = 10 } = params;
      const trimmedEstateId = estateId.trim();
      if (!trimmedEstateId) {
        return rejectWithValue({ message: "Please select an estate." });
      }

      const res = await axiosInstance.get<EnergyProviderConfigResponse>(
        "/api/v1/energy-provider/config",
        { params: { estateId: trimmedEstateId } },
      );

      const rows = sortEnergyProviderConfigsByCreatedAt(
        mapEnergyProviderConfigList(res.data, estateName),
      );

      return paginateEnergyProviderRows(rows, page, limit);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** POST /api/v1/energy-provider/config — set energy provider commission for an estate */
export const setEnergyProviderConfig = createAsyncThunk(
  "super-admin-energy-provider-config/setConfig",
  async (payload: EnergyProviderConfigPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post<EnergyProviderConfigResponse>(
        "/api/v1/energy-provider/config",
        {
          estateId: payload.estateId.trim(),
          companyId: payload.companyId.trim(),
          energyProviderUserId: payload.energyProviderUserId.trim(),
          commissionPercent: payload.commissionPercent,
        },
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
