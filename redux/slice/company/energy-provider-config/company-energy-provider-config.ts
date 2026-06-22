import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  mapEnergyProviderConfigList,
  paginateEnergyProviderRows,
  sortEnergyProviderConfigsByCreatedAt,
  type EnergyProviderConfigRow,
} from "@/lib/energy-provider-list";

export type { EnergyProviderConfigRow };

export interface GetCompanyEnergyProviderConfigsParams {
  estateId: string;
  estateName?: string;
  page?: number;
  limit?: number;
}

export interface CompanyEnergyProviderConfigListResult {
  data: EnergyProviderConfigRow[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
  };
}

export interface CompanyEnergyProviderConfigPayload {
  estateId: string;
  companyId: string;
  energyProviderUserId: string;
  commissionPercent: number;
}

export interface CompanyEnergyProviderConfigResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

/** GET /api/v1/energy-provider/config?estateId= */
export const getCompanyEnergyProviderConfigs = createAsyncThunk(
  "company-energy-provider-config/getConfigs",
  async (params: GetCompanyEnergyProviderConfigsParams, { rejectWithValue }) => {
    try {
      const { estateId, estateName, page = 1, limit = 10 } = params;
      const trimmedEstateId = estateId.trim();
      if (!trimmedEstateId) {
        return rejectWithValue({ message: "Please select an estate." });
      }

      const res = await axiosInstance.get<CompanyEnergyProviderConfigResponse>(
        "/api/v1/energy-provider/config",
        { params: { estateId: trimmedEstateId } },
      );

      const rows = sortEnergyProviderConfigsByCreatedAt(
        mapEnergyProviderConfigList(res.data, estateName),
      );

      return paginateEnergyProviderRows(rows, page, limit);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ??
          "Failed to fetch energy provider configurations",
      });
    }
  },
);

/** POST /api/v1/energy-provider/config */
export const setCompanyEnergyProviderConfig = createAsyncThunk(
  "company-energy-provider-config/setConfig",
  async (payload: CompanyEnergyProviderConfigPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post<CompanyEnergyProviderConfigResponse>(
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
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg)
          ? msg[0]
          : (msg ?? "Failed to set energy provider commission"),
      });
    }
  },
);
