import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";

export interface GetEnergyProviderVendsParams {
  estateId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface EnergyProviderVendsPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface EnergyProviderVendsResult {
  data: EnergyProviderVendRow[];
  pagination: EnergyProviderVendsPagination | null;
}

interface EnergyProviderVendsResponse {
  success?: boolean;
  message?: string;
  data?: EnergyProviderVendRow[];
  pagination?: {
    total?: number;
    currentPage?: number;
    page?: number;
    totalPages?: number;
    pages?: number;
    pageSize?: number;
    limit?: number;
  };
}

function normalizePagination(
  pagination: EnergyProviderVendsResponse["pagination"],
  dataLength: number,
  page: number,
  limit: number,
): EnergyProviderVendsPagination {
  const pageSize = Number(pagination?.pageSize ?? pagination?.limit ?? limit) || limit;
  const currentPage =
    Number(pagination?.currentPage ?? pagination?.page ?? page) || page;
  const total = Number(pagination?.total ?? dataLength) || dataLength;
  const totalPages =
    Number(pagination?.totalPages ?? pagination?.pages) ||
    Math.max(1, Math.ceil(total / pageSize));

  return { total, currentPage, totalPages, pageSize };
}

/** GET /api/v1/energy-provider/vends */
export const getEnergyProviderVends = createAsyncThunk(
  "energy-provider-vends/getVends",
  async (params: GetEnergyProviderVendsParams, { rejectWithValue }) => {
    try {
      const { estateId, page = 1, limit = 10, startDate, endDate } = params;
      const trimmedEstateId = estateId.trim();
      if (!trimmedEstateId) {
        return rejectWithValue({ message: "Please select an estate." });
      }

      const res = await axiosInstance.get<EnergyProviderVendsResponse>(
        "/api/v1/energy-provider/vends",
        {
          params: {
            estateId: trimmedEstateId,
            page,
            limit,
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
          },
        },
      );

      const data = res.data?.data ?? [];
      return {
        data,
        pagination: normalizePagination(res.data?.pagination, data.length, page, limit),
      } satisfies EnergyProviderVendsResult;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch vend history",
      });
    }
  },
);
