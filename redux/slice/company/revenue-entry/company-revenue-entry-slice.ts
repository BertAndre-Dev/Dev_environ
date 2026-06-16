import { createSlice } from "@reduxjs/toolkit";
import {
  createCompanyRevenueEntries,
  deleteCompanyRevenueEntry,
  fetchCompanyRevenueEntries,
  fetchCompanyRevenueEntryById,
  updateCompanyRevenueEntry,
  type CompanyRevenueEntry,
} from "./company-revenue-entry";
import type { RootState } from "@/redux/store";

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyRevenueEntryPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CompanyRevenueEntryState {
  createBulkState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: CompanyRevenueEntry[];
  selected: CompanyRevenueEntry | null;
  pagination: CompanyRevenueEntryPagination | null;
  error: string | null;
}

const initialState: CompanyRevenueEntryState = {
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

function getId(item: CompanyRevenueEntry | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const companyRevenueEntrySlice = createSlice({
  name: "companyRevenueEntry",
  initialState,
  reducers: {
    resetCompanyRevenueEntryError: (state) => {
      state.error = null;
    },
    clearCompanyRevenueEntries: (state) => {
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCompanyRevenueEntries.pending, (state) => {
        state.createBulkState = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyRevenueEntries.fulfilled, (state, action) => {
        state.createBulkState = "succeeded";
        const created: CompanyRevenueEntry[] =
          action.payload?.data ?? action.payload ?? [];
        if (Array.isArray(created) && created.length) {
          state.items = [...created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += created.length;
        }
      })
      .addCase(createCompanyRevenueEntries.rejected, (state, action) => {
        state.createBulkState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to create revenue entries.";
      });

    builder
      .addCase(fetchCompanyRevenueEntries.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyRevenueEntries.fulfilled, (state, action) => {
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
      .addCase(fetchCompanyRevenueEntries.rejected, (state, action) => {
        state.listState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch revenue entries.";
      });

    builder
      .addCase(fetchCompanyRevenueEntryById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyRevenueEntryById.fulfilled, (state, action) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCompanyRevenueEntryById.rejected, (state, action) => {
        state.getByIdState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch revenue entry.";
      });

    builder
      .addCase(updateCompanyRevenueEntry.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyRevenueEntry.fulfilled, (state, action) => {
        state.updateState = "succeeded";
        const updated: CompanyRevenueEntry | undefined =
          action.payload?.data ?? action.payload;
        const updatedId = getId(updated);
        if (!updatedId) return;
        state.items = (state.items ?? []).map((it) =>
          getId(it) === updatedId ? { ...it, ...updated } : it,
        );
      })
      .addCase(updateCompanyRevenueEntry.rejected, (state, action) => {
        state.updateState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to update revenue entry.";
      });

    builder
      .addCase(deleteCompanyRevenueEntry.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyRevenueEntry.fulfilled, (state, action) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCompanyRevenueEntry.rejected, (state, action) => {
        state.deleteState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to delete revenue entry.";
      });
  },
});

export const { resetCompanyRevenueEntryError, clearCompanyRevenueEntries } =
  companyRevenueEntrySlice.actions;
export default companyRevenueEntrySlice.reducer;

export const selectCompanyRevenueEntries = (state: RootState) =>
  (state.companyRevenueEntry as CompanyRevenueEntryState)?.items ?? [];
export const selectCompanyRevenueEntriesLoading = (state: RootState) =>
  (state.companyRevenueEntry as CompanyRevenueEntryState)?.listState ===
  "isLoading";
export const selectCompanyRevenueEntriesError = (state: RootState) =>
  (state.companyRevenueEntry as CompanyRevenueEntryState)?.error ?? null;
export const selectCompanyRevenueEntriesPagination = (state: RootState) =>
  (state.companyRevenueEntry as CompanyRevenueEntryState)?.pagination ?? null;
export const selectCompanyRevenueEntrySelected = (state: RootState) =>
  (state.companyRevenueEntry as CompanyRevenueEntryState)?.selected ?? null;
