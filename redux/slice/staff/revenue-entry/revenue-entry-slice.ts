import { createSlice } from "@reduxjs/toolkit";
import {
  createRevenueEntries,
  deleteRevenueEntry,
  fetchRevenueEntries,
  fetchRevenueEntryById,
  updateRevenueEntry,
  type RevenueEntry,
} from "./revenue-entry";
import type { RootState } from "@/redux/store";
import { isPending } from "@/lib/async-status";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface RevenueEntryPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface RevenueEntryState {
  createBulkState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: RevenueEntry[];
  selected: RevenueEntry | null;
  pagination: RevenueEntryPagination | null;
  error: string | null;
}

const initialState: RevenueEntryState = {
  createBulkState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  error: null,
};

function getId(item: RevenueEntry | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const revenueEntrySlice = createSlice({
  name: "staffRevenueEntry",
  initialState,
  reducers: {
    resetRevenueEntryError: (state) => {
      state.error = null;
    },
    clearRevenueEntries: (state) => {
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRevenueEntries.pending, (state) => {
        state.createBulkState = "isLoading";
        state.error = null;
      })
      .addCase(createRevenueEntries.fulfilled, (state, action: any) => {
        state.createBulkState = "succeeded";
        const created: RevenueEntry[] =
          action.payload?.data ?? action.payload ?? [];
        if (Array.isArray(created) && created.length) {
          state.items = [...created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += created.length;
        }
      })
      .addCase(createRevenueEntries.rejected, (state, action: any) => {
        state.createBulkState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to create revenue entries.";
      });

    builder
      .addCase(fetchRevenueEntries.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchRevenueEntries.fulfilled, (state, action: any) => {
        state.listState = "succeeded";
        const apiPagination = action.payload?.pagination || {};
        state.items = action.payload?.data || [];
        state.pagination = {
          total: apiPagination.total ?? state.items.length ?? 0,
          currentPage: apiPagination.page ?? 1,
          totalPages: apiPagination.pages ?? 1,
          pageSize: apiPagination.limit ?? 10,
        };
      })
      .addCase(fetchRevenueEntries.rejected, (state, action: any) => {
        state.listState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch revenue entries.";
      });

    builder
      .addCase(fetchRevenueEntryById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchRevenueEntryById.fulfilled, (state, action: any) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchRevenueEntryById.rejected, (state, action: any) => {
        state.getByIdState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to fetch revenue entry.";
      });

    builder
      .addCase(updateRevenueEntry.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateRevenueEntry.fulfilled, (state, action: any) => {
        state.updateState = "succeeded";
        const updated: RevenueEntry | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
      })
      .addCase(updateRevenueEntry.rejected, (state, action: any) => {
        state.updateState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to update revenue entry.";
      });

    builder
      .addCase(deleteRevenueEntry.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteRevenueEntry.fulfilled, (state, action: any) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteRevenueEntry.rejected, (state, action: any) => {
        state.deleteState = "failed";
        state.error =
          action?.payload?.message ||
          action?.error?.message ||
          "Failed to delete revenue entry.";
      });
  },
});

export const { resetRevenueEntryError, clearRevenueEntries } =
  revenueEntrySlice.actions;
export default revenueEntrySlice.reducer;

export const selectRevenueEntries = (state: RootState) =>
  (state.staffRevenueEntry as RevenueEntryState)?.items ?? [];
export const selectRevenueEntriesLoading = (state: RootState) =>
  isPending((state.staffRevenueEntry as RevenueEntryState)?.listState);
export const selectRevenueEntriesError = (state: RootState) =>
  (state.staffRevenueEntry as RevenueEntryState)?.error ?? null;
export const selectRevenueEntriesPagination = (state: RootState) =>
  (state.staffRevenueEntry as RevenueEntryState)?.pagination ?? null;
export const selectRevenueEntrySelected = (state: RootState) =>
  (state.staffRevenueEntry as RevenueEntryState)?.selected ?? null;


