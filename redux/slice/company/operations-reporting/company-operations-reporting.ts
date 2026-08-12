import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
};

export type CompanyOperationsReportingType = {
  id?: string;
  _id?: string;
  estateId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyOperationsReportingField = {
  id?: string;
  _id?: string;
  estateId?: string;
  typeId?: string;
  label: string;
  key: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyOperationsReportingEntry = {
  id?: string;
  _id?: string;
  fieldId?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeId = (id: string | undefined) => id ?? "";

export type FetchCompanyOperationsReportingTypesParams = {
  estateId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/types?estateId=... */
export const fetchCompanyOperationsReportingTypes = createAsyncThunk(
  "companyOperationsReporting/fetchTypes",
  async (
    { estateId, page = 1, limit = 10 }: FetchCompanyOperationsReportingTypesParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/operations-reporting/types", {
        params: {
          estateId: normalizeId(estateId).trim(),
          page,
          limit,
        },
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingType[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export type FetchCompanyOperationsReportingFieldsParams = {
  typeId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/fields?typeId=... */
export const fetchCompanyOperationsReportingFields = createAsyncThunk(
  "companyOperationsReporting/fetchFields",
  async (
    { typeId, page = 1, limit = 50 }: FetchCompanyOperationsReportingFieldsParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get("/api/v1/operations-reporting/fields", {
        params: {
          typeId: normalizeId(typeId).trim(),
          page,
          limit,
        },
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingField[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export type FetchCompanyOperationsReportingEntriesParams = {
  fieldId: string;
  page?: number;
  limit?: number;
};

/** GET /api/v1/operations-reporting/fields/{fieldId}/entries */
export const fetchCompanyOperationsReportingEntries = createAsyncThunk(
  "companyOperationsReporting/fetchEntries",
  async (
    { fieldId, page = 1, limit = 10 }: FetchCompanyOperationsReportingEntriesParams,
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}/entries`,
        { params: { page, limit } },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingEntry[];
        pagination?: ApiPagination;
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
