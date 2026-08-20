import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createRequestComment,
  getRequestComments,
  type RequestCommentItem,
} from "./request-comments";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface RequestCommentsState {
  commentsByRequestId: Record<string, RequestCommentItem[]>;
  getStatus: AsyncStatus;
  createStatus: AsyncStatus;
  activeRequestId: string | null;
  error: string | null;
}

const initialState: RequestCommentsState = {
  commentsByRequestId: {},
  getStatus: "idle",
  createStatus: "idle",
  activeRequestId: null,
  error: null,
};

const requestCommentsSlice = createSlice({
  name: "requestComments",
  initialState,
  reducers: {
    clearRequestComments: (state, action: PayloadAction<string>) => {
      delete state.commentsByRequestId[action.payload];
      if (state.activeRequestId === action.payload) {
        state.activeRequestId = null;
        state.getStatus = "idle";
        state.createStatus = "idle";
      }
    },
    clearRequestCommentsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getRequestComments.pending, (state, action) => {
        state.getStatus = "isLoading";
        state.activeRequestId = action.meta.arg.requestId;
        state.error = null;
      })
      .addCase(getRequestComments.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        state.activeRequestId = action.payload.requestId;
        state.commentsByRequestId[action.payload.requestId] =
          action.payload.comments;
      })
      .addCase(getRequestComments.rejected, (state, action) => {
        state.getStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to fetch comments";
      })
      .addCase(createRequestComment.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createRequestComment.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const { requestId, comment } = action.payload;
        const list = state.commentsByRequestId[requestId] ?? [];
        if (list.some((item) => item.id && item.id === comment.id)) {
          state.commentsByRequestId[requestId] = list.map((item) =>
            item.id === comment.id ? { ...item, ...comment } : item,
          );
          return;
        }
        state.commentsByRequestId[requestId] = [...list, comment];
      })
      .addCase(createRequestComment.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to add comment";
      });
  },
});

export const { clearRequestComments, clearRequestCommentsError } =
  requestCommentsSlice.actions;

export default requestCommentsSlice.reducer;
