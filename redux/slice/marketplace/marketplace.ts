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
  targetEstateIds?: string[];
  notes?: string;
  estateId?: string;
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

function marketplaceWriteBody<T extends { link?: string; estateId?: string; userId?: string }>(
  body: T,
) {
  const { estateId: _estateId, userId: _userId, ...rest } = body;
  return withAbsoluteLink(rest);
}

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
