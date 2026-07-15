import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
};

export type { MaintenanceFrequency } from "@/lib/asset-maintenance-frequency";

export type AssetMaintenanceRecord = {
  id?: string;
  _id?: string;
  estateId?: string;
  assetId?: string | { id?: string; _id?: string; name?: string };
  categoryId?: string | { id?: string; _id?: string; name?: string };
  tag?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  frequency?: string;
  recurring?: boolean;
  recurringSpanMonths?: number;
  recurringSpanYears?: number;
  note?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MaintenanceListResponse = {
  success?: boolean;
  message?: string;
  data?: AssetMaintenanceRecord[];
  pagination?: ApiPagination;
};

export type GetMaintenanceListParams = {
  estateId: string;
  page?: number;
  limit?: number;
  isActive?: string;
};

export type CreateMaintenancePayload = {
  estateId: string;
  assetId: string;
  categoryId: string;
  tag: string;
  lastMaintenanceDate: string;
  frequency: string;
  recurring: boolean;
  recurringSpanMonths: number;
  recurringSpanYears: number;
  note?: string;
};

export type UpdateMaintenancePayload = {
  maintenanceId: string;
  lastMaintenanceDate?: string;
  frequency?: string;
  note?: string;
};

export type AddMaintenanceCommentPayload = {
  maintenanceId: string;
  comment: string;
};

export type AssetMaintenanceComment = {
  id?: string;
  _id?: string;
  maintenanceId?: string;
  comment?: string;
  text?: string;
  userId?: string;
  userName?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export type GetMaintenanceCommentsParams = {
  maintenanceId: string;
  estateId?: string;
  page?: number;
  limit?: number;
};

export type MaintenanceCommentsResponse = {
  success?: boolean;
  message?: string;
  data?: AssetMaintenanceComment[];
  pagination?: ApiPagination;
};

const normalizeId = (id: string | undefined) => id ?? "";

function getApiErrorMessage(error: unknown): string | undefined {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === "string" && msg.trim()) return msg;
  return undefined;
}

/** POST /api/v1/asset-maintenance */
export const createAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/create",
  async (payload: CreateMaintenancePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/asset-maintenance", payload);
      return res.data as { success?: boolean; message?: string; data?: AssetMaintenanceRecord };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** GET /api/v1/asset-maintenance?estateId=... */
export const getAssetMaintenanceList = createAsyncThunk(
  "company-asset-maintenance/getList",
  async (params: GetMaintenanceListParams, { rejectWithValue }) => {
    try {
      const { estateId, page = 1, limit = 10, isActive } = params;
      const estateIdValue = normalizeId(estateId).trim();
      if (!estateIdValue) {
        return rejectWithValue({});
      }
      const res = await axiosInstance.get<MaintenanceListResponse>(
        "/api/v1/asset-maintenance",
        {
          params: {
            estateId: estateIdValue,
            page,
            limit,
            isActive: isActive?.trim() || undefined,
          },
        },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** GET /api/v1/asset-maintenance/{maintenanceId} */
export const getAssetMaintenanceById = createAsyncThunk(
  "company-asset-maintenance/getById",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
      );
      return res.data as { success?: boolean; message?: string; data?: AssetMaintenanceRecord };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId} */
export const updateAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/update",
  async (payload: UpdateMaintenancePayload, { rejectWithValue }) => {
    try {
      const { maintenanceId, ...body } = payload;
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
        body,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** DELETE /api/v1/asset-maintenance/{maintenanceId} */
export const deleteAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/delete",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}`,
      );
      return { ...(res.data as object), deletedId: maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId}/suspend */
export const suspendAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/suspend",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/suspend`,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** PUT /api/v1/asset-maintenance/{maintenanceId}/activate */
export const activateAssetMaintenance = createAsyncThunk(
  "company-asset-maintenance/activate",
  async (maintenanceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/activate`,
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** GET /api/v1/asset-maintenance/{maintenanceId}/comments */
export const getAssetMaintenanceComments = createAsyncThunk(
  "company-asset-maintenance/getComments",
  async (params: GetMaintenanceCommentsParams, { rejectWithValue }) => {
    try {
      const { maintenanceId, estateId, page = 1, limit = 20 } = params;
      const res = await axiosInstance.get<MaintenanceCommentsResponse>(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/comments`,
        {
          params: {
            estateId: estateId?.trim() || undefined,
            page,
            limit,
          },
        },
      );
      return { ...res.data, maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);

/** POST /api/v1/asset-maintenance/{maintenanceId}/comments */
export const addAssetMaintenanceComment = createAsyncThunk(
  "company-asset-maintenance/addComment",
  async (payload: AddMaintenanceCommentPayload, { rejectWithValue }) => {
    try {
      const { maintenanceId, comment } = payload;
      const res = await axiosInstance.post(
        `/api/v1/asset-maintenance/${normalizeId(maintenanceId)}/comments`,
        { comment },
      );
      return { ...(res.data as object), maintenanceId };
    } catch (error: unknown) {
      return rejectWithValue({ message: getApiErrorMessage(error) });
    }
  },
);
