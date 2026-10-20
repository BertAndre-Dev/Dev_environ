import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { parseEstateModulesResponse } from "@/lib/estate-module-labels";
import { apiErrorRejectValue } from "@/lib/api-error";
import { toEstateWriteBody } from "@/lib/plans";

export enum VisitorVerificationMode {
  VIEW_AND_VERIFY = "VIEW_AND_VERIFY",
  VERIFY_ONLY = "VERIFY_ONLY",
  VIEW_ONLY = "VIEW_ONLY",
}

export interface EstateData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive?: boolean;
  modules?: string[];
  plan?: string;
  minVendAmount?: number;
  maxVendAmount?: number;
  visitorVerificationMode?: VisitorVerificationMode;
}

/** GET /api/v1/estate-mgt/{id}/modules — enabled modules for an estate */
export const fetchEstateModules = createAsyncThunk(
  "super-admin-est-mgt/fetchEstateModules",
  async (estateId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/estate-mgt/${estateId}/modules`,
      );
      return { data: parseEstateModulesResponse(res.data) };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// create estate
export const createEstate = createAsyncThunk(
  "super-admin-est-mgt/createEstate",
  async (data: EstateData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/estate-mgt",
        toEstateWriteBody(data),
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// get all estate
export const getAllEstates = createAsyncThunk(
  "super-admin-est-mgt/getAllEstates",
  async (
    {
      limit = 10,
      page = 1,
      search,
      startDate,
      endDate,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (search?.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(`/api/v1/estate-mgt` + suffix);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

function readLinkedCompanyId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const record = value as { id?: unknown; _id?: unknown };
    return String(record.id ?? record._id ?? "").trim();
  }
  return "";
}

/**
 * Estates for one company. `/api/v1/estate-mgt` is the list endpoint;
 * rows are kept when `companyId` (or `company`) matches the company.
 * Does not write the global estate list.
 */
export const getEstatesByCompany = createAsyncThunk(
  "super-admin-est-mgt/getEstatesByCompany",
  async (
    {
      companyId,
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
    }: {
      companyId: string;
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const targetId = companyId.trim();
      const pageSize = 100;
      const collected: Record<string, unknown>[] = [];
      let fetchPage = 1;
      let reportedTotal = Number.POSITIVE_INFINITY;

      while (fetchPage <= 30 && collected.length < reportedTotal) {
        const params = new URLSearchParams();
        params.set("page", String(fetchPage));
        params.set("limit", String(pageSize));
        if (search?.trim()) params.set("search", search.trim());
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await axiosInstance.get(
          `/api/v1/estate-mgt?${params.toString()}`,
        );
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const reported = Number(res.data?.pagination?.total);
        if (Number.isFinite(reported) && reported > 0) reportedTotal = reported;
        collected.push(...rows);

        if (rows.length === 0 || rows.length !== pageSize) break;
        fetchPage += 1;
      }

      const needle = search?.trim().toLowerCase();
      const matched = collected.filter((item) => {
        const linked =
          readLinkedCompanyId(item.companyId) ||
          readLinkedCompanyId(item.company);
        if (linked !== targetId) return false;
        if (!needle) return true;
        const name = String(item.name ?? "").toLowerCase();
        const address = String(item.address ?? "").toLowerCase();
        return name.includes(needle) || address.includes(needle);
      });

      const safeLimit = Math.max(1, limit);
      const safePage = Math.max(1, page);
      const start = (safePage - 1) * safeLimit;

      return {
        data: matched.slice(start, start + safeLimit),
        pagination: {
          total: matched.length,
          currentPage: safePage,
          totalPages: Math.max(1, Math.ceil(matched.length / safeLimit)),
          pageSize: safeLimit,
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// get individual estate
export const getEstate = createAsyncThunk(
  "super-admin-est-mgt/getEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/estate-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// delete an estate
export const deleteEstate = createAsyncThunk(
  "super-admin-est-mgt/deleteEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/api/v1/estate-mgt/${id}`);
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// update an estate
export const updateEstate = createAsyncThunk(
  "super-admin-est-mgt/updateEstate",
  async (
    { id, data }: { id: string; data: EstateData },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}`,
        toEstateWriteBody(data),
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// suspend an estate
export const suspendEstate = createAsyncThunk(
  "super-admin-est-mgt/suspendEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}/suspend-estate`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

// activate an estate
export const activateEstate = createAsyncThunk(
  "super-admin-est-mgt/activateEstate",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/estate-mgt/${id}/activate-estate`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);