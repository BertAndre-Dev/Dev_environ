import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import { labelToReportingFieldKey } from "@/lib/operations-reporting-field-key";

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

/** POST /api/v1/operations-reporting/types */
export const createCompanyOperationsReportingType = createAsyncThunk(
  "companyOperationsReporting/createType",
  async (
    payload: { estateId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/operations-reporting/types",
        payload,
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingType;
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/operations-reporting/types/{typeId} */
export const updateCompanyOperationsReportingType = createAsyncThunk(
  "companyOperationsReporting/updateType",
  async (
    {
      typeId,
      name,
      description,
    }: { typeId: string; name: string; description?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/operations-reporting/types/${normalizeId(typeId)}`,
        { name, description },
      );
      return {
        ...(res.data as object),
        typeId,
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** DELETE /api/v1/operations-reporting/types/{typeId} */
export const deleteCompanyOperationsReportingType = createAsyncThunk(
  "companyOperationsReporting/deleteType",
  async (typeId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/operations-reporting/types/${normalizeId(typeId)}`,
      );
      return { ...(res.data as object), deletedTypeId: typeId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** POST /api/v1/operations-reporting/fields */
export const createCompanyOperationsReportingField = createAsyncThunk(
  "companyOperationsReporting/createField",
  async (
    payload: {
      estateId: string;
      typeId: string;
      label: string;
      key?: string;
    },
    { rejectWithValue },
  ) => {
    const estateIdValue = normalizeId(payload.estateId).trim();
    const typeIdValue = normalizeId(payload.typeId).trim();
    const label = payload.label.trim();
    const key = payload.key?.trim() || labelToReportingFieldKey(label);
    if (!estateIdValue || !typeIdValue) {
      return rejectWithValue({
        message: "Estate and reporting type are required.",
      });
    }
    if (!label || !key) {
      return rejectWithValue({
        message: "Field label is required.",
      });
    }
    try {
      const res = await axiosInstance.post(
        "/api/v1/operations-reporting/fields",
        {
          estateId: estateIdValue,
          typeId: typeIdValue,
          label,
          key,
        },
      );
      return res.data as {
        success?: boolean;
        message?: string;
        data?: CompanyOperationsReportingField;
      };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/operations-reporting/fields/{fieldId} */
export const updateCompanyOperationsReportingField = createAsyncThunk(
  "companyOperationsReporting/updateField",
  async (
    {
      fieldId,
      label,
      key,
    }: { fieldId: string; label: string; key?: string },
    { rejectWithValue },
  ) => {
    const trimmedLabel = label.trim();
    const resolvedKey = key?.trim() || labelToReportingFieldKey(trimmedLabel);
    if (!trimmedLabel || !resolvedKey) {
      return rejectWithValue({ message: "Field label is required." });
    }
    try {
      const res = await axiosInstance.put(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}`,
        { label: trimmedLabel, key: resolvedKey },
      );
      return { ...(res.data as object), fieldId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** DELETE /api/v1/operations-reporting/fields/{fieldId} */
export const deleteCompanyOperationsReportingField = createAsyncThunk(
  "companyOperationsReporting/deleteField",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/operations-reporting/fields/${normalizeId(fieldId)}`,
      );
      return { ...(res.data as object), deletedFieldId: fieldId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
