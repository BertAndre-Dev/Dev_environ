import { createAsyncThunk } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  enrichRequestComments,
  extractCommentRecords,
  parseRequestComment,
  type RequestCommentItem,
} from "@/lib/request-comments";
import axiosInstance from "@/utils/axiosInstance";

export type { RequestCommentItem };

export interface ListRequestCommentsParams {
  requestId: string;
  estateId?: string;
  page?: number;
  limit?: number;
}

export interface CreateRequestCommentPayload {
  requestId: string;
  estateId?: string;
  text: string;
  /** Public https:// URL from POST /api/v1/uploads. Never send base64 here. */
  image?: string;
}

/** GET /api/v1/requests/{id}/comments */
export const getRequestComments = createAsyncThunk(
  "requestComments/getList",
  async (params: ListRequestCommentsParams, { rejectWithValue }) => {
    const requestId = params.requestId?.trim();
    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }

    try {
      const estateId = params.estateId?.trim();
      const query: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
      };
      if (estateId) query.estateId = estateId;

      const res = await axiosInstance.get(
        `/api/v1/requests/${requestId}/comments`,
        { params: query },
      );
      const comments = await enrichRequestComments(
        extractCommentRecords(res.data).map(parseRequestComment),
      );
      return { requestId, comments };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        return { requestId, comments: [] as RequestCommentItem[] };
      }
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to fetch comments",
      });
    }
  },
);

/** POST /api/v1/requests/{id}/comments */
export const createRequestComment = createAsyncThunk(
  "requestComments/create",
  async (payload: CreateRequestCommentPayload, { rejectWithValue }) => {
    const requestId = payload.requestId?.trim();
    const estateId = payload.estateId?.trim();
    const text = payload.text?.trim();
    const image = payload.image?.trim();

    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }
    if (!text) {
      return rejectWithValue({ message: "Comment text is required." });
    }

    try {
      const body: Record<string, string> = { text };
      if (image) body.image = image;

      const res = await axiosInstance.post(
        `/api/v1/requests/${requestId}/comments`,
        body,
        { params: estateId ? { estateId } : undefined },
      );
      const records = extractCommentRecords(res.data);
      const parsed = records.length
        ? parseRequestComment(records[records.length - 1])
        : null;
      const comment: RequestCommentItem = parsed?.id
        ? parsed
        : {
            id: `local-${Date.now()}`,
            requestId,
            text,
            image: image || undefined,
            createdAt: new Date().toISOString(),
          };
      const [enriched] = await enrichRequestComments([comment]);
      return { requestId, comment: enriched ?? comment };
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error) ?? "Failed to add comment",
      });
    }
  },
);
