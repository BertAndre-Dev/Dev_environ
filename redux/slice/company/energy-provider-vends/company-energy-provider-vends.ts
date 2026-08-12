import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import type { EnergyProviderVendRow } from "@/lib/energy-provider-vends";
import { getApiErrorMessage } from "@/lib/api-error";

export interface GetCompanyEnergyProviderVendsParams {
  estateId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CompanyEnergyProviderVendsPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CompanyEnergyProviderVendsResult {
  data: EnergyProviderVendRow[];
  pagination: CompanyEnergyProviderVendsPagination | null;
}

interface CompanyEnergyProviderVendsResponse {
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
  pagination: CompanyEnergyProviderVendsResponse["pagination"],
  dataLength: number,
  page: number,
  limit: number,
): CompanyEnergyProviderVendsPagination {
  const pageSize =
    Number(pagination?.pageSize ?? pagination?.limit ?? limit) || limit;
  const currentPage =
    Number(pagination?.currentPage ?? pagination?.page ?? page) || page;
  const total = Number(pagination?.total ?? dataLength) || dataLength;
  const totalPages =
    Number(pagination?.totalPages ?? pagination?.pages) ||
    Math.max(1, Math.ceil(total / pageSize));

  return { total, currentPage, totalPages, pageSize };
}

/** GET /api/v1/energy-provider/vends */
export const getCompanyEnergyProviderVends = createAsyncThunk(
  "company-energy-provider-vends/getVends",
  async (params: GetCompanyEnergyProviderVendsParams, { rejectWithValue }) => {
    try {
      const { estateId, page = 1, limit = 10, startDate, endDate } = params;
      const trimmedEstateId = estateId.trim();
      if (!trimmedEstateId) {
        return rejectWithValue({ message: "Please select an estate." });
      }

      const res = await axiosInstance.get<CompanyEnergyProviderVendsResponse>(
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
        pagination: normalizePagination(
          res.data?.pagination,
          data.length,
          page,
          limit,
        ),
      } satisfies CompanyEnergyProviderVendsResult;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
