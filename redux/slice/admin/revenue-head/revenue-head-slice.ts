import { createSlice } from "@reduxjs/toolkit";
import {
  createRevenueHead,
  deleteRevenueHead,
  fetchRevenueHeads,
  fetchRevenueHeadById,
  updateRevenueHead,
  type RevenueHead,
} from "./revenue-head";
import type { RootState } from "@/redux/store";

export interface RevenueHeadPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface RevenueHeadState {
  createState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: RevenueHead[];
  selected: RevenueHead | null;
  pagination: RevenueHeadPagination | null;
  error: string | null;
}

const initialState: RevenueHeadState = {
  createState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  error: null,
};

function getId(item: RevenueHead | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const revenueHeadSlice = createSlice({
  name: "adminRevenueHead",
  initialState,
  reducers: {
    resetRevenueHeadError: (state) => {
      state.error = null;
    },
    clearSelectedRevenueHead: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRevenueHead.pending, (state) => {
        state.createState = "isLoading";
        state.error = null;
      })
      .addCase(createRevenueHead.fulfilled, (state, action) => {
        state.createState = "succeeded";
        const created: RevenueHead | undefined =
          action.payload?.data ?? action.payload;
        if (created) {
          state.items = [created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += 1;
        }
      })
      .addCase(createRevenueHead.rejected, (state, action: any) => {
        state.createState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to create revenue head.";
      });

    builder
      .addCase(fetchRevenueHeads.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchRevenueHeads.fulfilled, (state, action: any) => {
        state.listState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.items = action.payload?.data || [];
        state.pagination = {
          total: apiPagination.total ?? state.items.length ?? 0,
          currentPage: apiPagination.page ?? 1,
          totalPages: apiPagination.pages ?? 1,
          pageSize: apiPagination.limit ?? 12,
        };
      })
      .addCase(fetchRevenueHeads.rejected, (state, action: any) => {
        state.listState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch revenue heads.";
      });

    builder
      .addCase(fetchRevenueHeadById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchRevenueHeadById.fulfilled, (state, action: any) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchRevenueHeadById.rejected, (state, action: any) => {
        state.getByIdState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch revenue head.";
      });

    builder
      .addCase(updateRevenueHead.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateRevenueHead.fulfilled, (state, action: any) => {
        state.updateState = "succeeded";
        const updated: RevenueHead | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
        if (state.selected && getId(state.selected) === updatedId) {
          state.selected = { ...state.selected, ...updated };
        }
      })
      .addCase(updateRevenueHead.rejected, (state, action: any) => {
        state.updateState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to update revenue head.";
      });

    builder
      .addCase(deleteRevenueHead.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteRevenueHead.fulfilled, (state, action: any) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteRevenueHead.rejected, (state, action: any) => {
        state.deleteState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to delete revenue head.";
      });
  },
});

export const { resetRevenueHeadError, clearSelectedRevenueHead } =
  revenueHeadSlice.actions;
export default revenueHeadSlice.reducer;

export const selectRevenueHeads = (state: RootState) =>
  (state.adminRevenueHead as RevenueHeadState)?.items ?? [];
export const selectRevenueHeadsLoading = (state: RootState) =>
  (state.adminRevenueHead as RevenueHeadState)?.listState === "isLoading";
export const selectRevenueHeadsError = (state: RootState) =>
  (state.adminRevenueHead as RevenueHeadState)?.error ?? null;
export const selectRevenueHeadsPagination = (state: RootState) =>
  (state.adminRevenueHead as RevenueHeadState)?.pagination ?? null;

