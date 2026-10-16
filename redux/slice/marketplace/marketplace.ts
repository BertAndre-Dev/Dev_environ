import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { apiErrorRejectValue } from "@/lib/api-error";
import {
  ensureHttpUrl,
  type MarketplaceAudience,
} from "@/lib/marketplace";

export interface MarketplaceAd {
  id?: string;
  companyName?: string;
  productName?: string;
  link?: string;
  productCategory?: string;
  productDescription?: string;
  image?: string;
  images?: string[];
  videos?: string[];
  startDate?: string;
  endDate?: string;
  audience?: MarketplaceAudience | string;
  estateName?: string | null;
  estate?: { id?: string; _id?: string; name?: string } | string | null;
  targetEstateIds?: string[];
  targetEstates?: Array<{
    id?: string;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  }>;
  notes?: string;
  estateId?: string | { id?: string; _id?: string; name?: string } | null;
  status?: string;
  isSuspended?: boolean;
  rejectionReason?: string;
  approvedAt?: string;
  approvedByUserId?: string;
  rejectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MarketplaceItem = MarketplaceAd;

export interface MarketplaceListResponse {
  success?: boolean;
  data?: MarketplaceAd[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetMarketplaceParams {
  page?: number;
  limit?: number;
  status?: string;
  estateId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateMarketplacePayload {
  companyName: string;
  productName: string;
  link: string;
  productCategory: string;
  productDescription: string;
  image?: string;
  images?: string[];
  videos?: string[];
  /** New photos. Sent with the listing so the API stores their URLs. */
  imageFiles?: File[];
  /** New videos. Sent with the listing so the API stores their URLs. */
  videoFiles?: File[];
  startDate: string;
  endDate: string;
  audience: MarketplaceAudience;
  targetEstateIds?: string[];
  notes?: string;
}

export interface UpdateMarketplacePayload extends Partial<CreateMarketplacePayload> {
  marketPlaceId: string;
}

function withAbsoluteLink<T extends { link?: string }>(body: T): T {
  if (body.link == null) return body;
  return { ...body, link: ensureHttpUrl(body.link) };
}

function isBrowserFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value == null || value === "") return;
  if (Array.isArray(value)) {
    for (const entry of value) appendFormValue(form, key, entry);
    return;
  }
  if (isBrowserFile(value)) {
    form.append(key, value, value.name);
    return;
  }
  form.append(key, String(value));
}

/**
 * Marketplace create/update accepts the files and turns them into URLs.
 * Kept media stays as URL strings on `images` / `videos`.
 */
function marketplaceWriteBody(
  body: CreateMarketplacePayload | Omit<UpdateMarketplacePayload, "marketPlaceId">,
): FormData {
  const {
    estateId: _estateId,
    userId: _userId,
    imageFiles,
    videoFiles,
    ...rest
  } = body as CreateMarketplacePayload & { estateId?: string; userId?: string };
  const form = new FormData();
  const fields = withAbsoluteLink(rest);
  for (const [key, value] of Object.entries(fields)) {
    appendFormValue(form, key, value);
  }
  for (const file of imageFiles ?? []) {
    if (isBrowserFile(file)) form.append("images", file, file.name);
  }
  for (const file of videoFiles ?? []) {
    if (isBrowserFile(file)) form.append("videos", file, file.name);
  }
  return form;
}

const multipartRequest = {
  transformRequest: [
    (data: unknown, headers: { setContentType?: (value: false) => void; [key: string]: unknown }) => {
      if (typeof headers?.setContentType === "function") {
        headers.setContentType(false);
      } else if (headers) {
        delete headers["Content-Type"];
      }
      return data;
    },
  ],
};

/** GET /api/v1/marketplace — public feed for the active estate */
export const getMarketplaceFeed = createAsyncThunk(
  "marketplace/getFeed",
  async (params: GetMarketplaceParams | undefined, { rejectWithValue }) => {
    try {
      const {
        page = 1,
        limit = 12,
        status,
        estateId,
        category,
        startDate,
        endDate,
      } = params ?? {};
      const query: Record<string, string | number> = { page, limit };
      if (status) query.status = status;
      if (estateId) query.estateId = estateId;
      if (category) query.category = category;
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;
      const res = await axiosInstance.get<MarketplaceListResponse>(
        "/api/v1/marketplace",
        { params: query },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/marketplace/mine */
export const getMyMarketplaceAds = createAsyncThunk(
  "marketplace/getMine",
  async (
    params: { page?: number; limit?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const { page = 1, limit = 10 } = params ?? {};
      const res = await axiosInstance.get<MarketplaceListResponse>(
        "/api/v1/marketplace/mine",
        { params: { page, limit } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/marketplace/pending — super admin */
export const getPendingMarketplaceAds = createAsyncThunk(
  "marketplace/getPending",
  async (
    params: { page?: number; limit?: number } | undefined,
    { rejectWithValue },
  ) => {
    try {
      const { page = 1, limit = 10 } = params ?? {};
      const res = await axiosInstance.get<MarketplaceListResponse>(
        "/api/v1/marketplace/pending",
        { params: { page, limit } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** GET /api/v1/marketplace/{marketPlaceId} */
export const getMarketplaceById = createAsyncThunk(
  "marketplace/getById",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/marketplace/${marketPlaceId}`,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** POST /api/v1/marketplace/create */
export const createMarketplaceAd = createAsyncThunk(
  "marketplace/create",
  async (payload: CreateMarketplacePayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/marketplace/create",
        marketplaceWriteBody(payload),
        multipartRequest,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/update */
export const updateMarketplaceAd = createAsyncThunk(
  "marketplace/update",
  async (payload: UpdateMarketplacePayload, { rejectWithValue }) => {
    try {
      const { marketPlaceId, ...body } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/update`,
        marketplaceWriteBody(body),
        multipartRequest,
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/approve */
export const approveMarketplaceAd = createAsyncThunk(
  "marketplace/approve",
  async (
    payload: { marketPlaceId: string; notes?: string },
    { rejectWithValue },
  ) => {
    try {
      const { marketPlaceId, notes } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/approve`,
        notes?.trim() ? { notes: notes.trim() } : {},
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/reject */
export const rejectMarketplaceAd = createAsyncThunk(
  "marketplace/reject",
  async (
    payload: { marketPlaceId: string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const { marketPlaceId, reason } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/reject`,
        { reason },
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/suspend */
export const suspendMarketplaceAd = createAsyncThunk(
  "marketplace/suspend",
  async (
    payload: { marketPlaceId: string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const { marketPlaceId, reason } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/suspend`,
        { reason },
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** PUT /api/v1/marketplace/{marketPlaceId}/activate */
export const activateMarketplaceAd = createAsyncThunk(
  "marketplace/activate",
  async (
    payload: { marketPlaceId: string; notes?: string },
    { rejectWithValue },
  ) => {
    try {
      const { marketPlaceId, notes } = payload;
      const res = await axiosInstance.put(
        `/api/v1/marketplace/${marketPlaceId}/activate`,
        notes?.trim() ? { notes: notes.trim() } : {},
      );
      return { ...res.data, marketPlaceId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

/** DELETE /api/v1/marketplace/{marketPlaceId} */
export const deleteMarketplaceAd = createAsyncThunk(
  "marketplace/delete",
  async (marketPlaceId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/marketplace/${marketPlaceId}`,
      );
      return { ...res.data, deletedId: marketPlaceId };
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);

export type MarketplaceTargetEstate = {
  id?: string;
  _id?: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type GetMarketplaceEstatesParams = {
  page?: number;
  limit?: number;
  search?: string;
};

/** GET /api/v1/marketplace/estates — estates for OTHER_ESTATES targeting */
export const getMarketplaceEstates = createAsyncThunk(
  "marketplace/getEstates",
  async (params: GetMarketplaceEstatesParams | undefined, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 100, search } = params ?? {};
      const query: Record<string, string | number> = { page, limit };
      const trimmed = search?.trim();
      if (trimmed) query.search = trimmed;
      const res = await axiosInstance.get<{
        success?: boolean;
        data?: MarketplaceTargetEstate[];
        pagination?: MarketplaceListResponse["pagination"];
      }>("/api/v1/marketplace/estates", { params: query });
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
