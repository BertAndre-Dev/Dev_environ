import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiErrorRejectValue, getApiErrorMessage } from "@/lib/api-error";
import {
  DESIGNATIONS_PAGE_SIZE,
  extractDesignation,
  extractDesignationPagination,
  extractDesignations,
  type Designation,
  type DesignationPagination,
} from "@/lib/designations";
import axiosInstance from "@/utils/axiosInstance";

export type { Designation, DesignationPagination };

export type ListDesignationsParams = {
  companyId?: string;
  estateId?: string;
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateDesignationPayload = {
  name: string;
  description?: string;
  companyId?: string;
  estateId?: string;
};

export type UpdateDesignationPayload = {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type DesignationListResult = {
  items: Designation[];
  pagination: DesignationPagination;
};

/** POST /api/v1/designations */
export const createDesignation = createAsyncThunk(
  "designations/create",
  async (payload: CreateDesignationPayload, { rejectWithValue }) => {
    const name = payload.name.trim();
    if (!name) {
      return rejectWithValue({ message: "Name is required." });
    }

    const body: Record<string, string> = { name };
    const description = payload.description?.trim();
    const companyId = payload.companyId?.trim();
    const estateId = payload.estateId?.trim();
    if (description) body.description = description;
    if (companyId) body.companyId = companyId;
    if (estateId) body.estateId = estateId;

    try {
      const res = await axiosInstance.post("/api/v1/designations", body);
      const item = extractDesignation(res.data);
      return {
        item: item ?? {
          id: name,
          name,
          description: description ?? "",
          companyId: companyId || undefined,
          estateId: estateId || undefined,
          isActive: true,
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to create designation.",
        },
      );
    }
  },
);

/** GET /api/v1/designations */
export const getDesignations = createAsyncThunk(
  "designations/getList",
  async (params: ListDesignationsParams, { rejectWithValue }) => {
    const companyId = params.companyId?.trim();
    const estateId = params.estateId?.trim();
    if (!companyId && !estateId) {
      return rejectWithValue({
        message: "A company or estate is required to list designations.",
      });
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? DESIGNATIONS_PAGE_SIZE;
    const query: Record<string, string | number> = { page, limit };
    if (companyId) query.companyId = companyId;
    if (estateId) query.estateId = estateId;
    const search = params.search?.trim();
    if (search) query.search = search;
    if (params.includeInactive) query.includeInactive = "true";

    try {
      const res = await axiosInstance.get("/api/v1/designations", {
        params: query,
      });
      const items = extractDesignations(res.data);
      return {
        items,
        pagination: extractDesignationPagination(res.data, {
          page,
          limit,
          total: items.length,
        }),
      } satisfies DesignationListResult;
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to load designations.",
        },
      );
    }
  },
);

/** GET /api/v1/designations/{id} */
export const getDesignationById = createAsyncThunk(
  "designations/getById",
  async (id: string, { rejectWithValue }) => {
    const designationId = id.trim();
    if (!designationId) {
      return rejectWithValue({ message: "Designation id is required." });
    }

    try {
      const res = await axiosInstance.get(
        `/api/v1/designations/${designationId}`,
      );
      const item = extractDesignation(res.data);
      if (!item) {
        return rejectWithValue({ message: "Designation not found." });
      }
      return { item };
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to load designation.",
        },
      );
    }
  },
);

/** PUT /api/v1/designations/{id} */
export const updateDesignation = createAsyncThunk(
  "designations/update",
  async (payload: UpdateDesignationPayload, { rejectWithValue }) => {
    const id = payload.id.trim();
    if (!id) {
      return rejectWithValue({ message: "Designation id is required." });
    }

    const body: Record<string, string | boolean> = {};
    if (typeof payload.name === "string") body.name = payload.name.trim();
    if (typeof payload.description === "string") {
      body.description = payload.description.trim();
    }
    if (typeof payload.isActive === "boolean") body.isActive = payload.isActive;

    try {
      const res = await axiosInstance.put(`/api/v1/designations/${id}`, body);
      const item = extractDesignation(res.data);
      return {
        item: item ?? {
          id,
          name: typeof payload.name === "string" ? payload.name.trim() : "",
          description:
            typeof payload.description === "string"
              ? payload.description.trim()
              : "",
          isActive: payload.isActive ?? true,
        },
      };
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to update designation.",
        },
      );
    }
  },
);

/** DELETE /api/v1/designations/{id} */
export const deleteDesignation = createAsyncThunk(
  "designations/delete",
  async (id: string, { rejectWithValue }) => {
    const designationId = id.trim();
    if (!designationId) {
      return rejectWithValue({ message: "Designation id is required." });
    }

    try {
      await axiosInstance.delete(`/api/v1/designations/${designationId}`);
      return { id: designationId };
    } catch (error: unknown) {
      return rejectWithValue(
        apiErrorRejectValue(error) ?? {
          message: getApiErrorMessage(error) ?? "Failed to delete designation.",
        },
      );
    }
  },
);
