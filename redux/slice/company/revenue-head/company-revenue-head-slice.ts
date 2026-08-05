import { createSlice } from "@reduxjs/toolkit";
import {
  createCompanyRevenueHead,
  deleteCompanyRevenueHead,
  fetchCompanyRevenueHeads,
  fetchCompanyRevenueHeadById,
  updateCompanyRevenueHead,
  type CompanyRevenueHead,
} from "./company-revenue-head";
import type { RootState } from "@/redux/store";
import { isPending } from "@/lib/async-status";

export interface CompanyRevenueHeadPagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

type AsyncState = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyRevenueHeadState {
  createState: AsyncState;
  listState: AsyncState;
  getByIdState: AsyncState;
  updateState: AsyncState;
  deleteState: AsyncState;
  items: CompanyRevenueHead[];
  selected: CompanyRevenueHead | null;
  pagination: CompanyRevenueHeadPagination | null;
  selectedEstateId: string | null;
  error: string | null;
}

const initialState: CompanyRevenueHeadState = {
  createState: "idle",
  listState: "idle",
  getByIdState: "idle",
  updateState: "idle",
  deleteState: "idle",
  items: [],
  selected: null,
  pagination: null,
  selectedEstateId: null,
  error: null,
};

function getId(item: CompanyRevenueHead | null | undefined): string | undefined {
  return item?.id ?? item?._id;
}

const companyRevenueHeadSlice = createSlice({
  name: "companyRevenueHead",
  initialState,
  reducers: {
    resetCompanyRevenueHeadError: (state) => {
      state.error = null;
    },
    clearSelectedCompanyRevenueHead: (state) => {
      state.selected = null;
    },
    setCompanyRevenueHeadEstate: (state, action: { payload: string | null }) => {
      state.selectedEstateId = action.payload;
      state.items = [];
      state.pagination = null;
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCompanyRevenueHead.pending, (state) => {
        state.createState = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyRevenueHead.fulfilled, (state, action) => {
        state.createState = "succeeded";
        const created: CompanyRevenueHead | undefined =
          action.payload?.data ?? action.payload;
        if (created) {
          state.items = [created, ...(state.items ?? [])];
          if (state.pagination) state.pagination.total += 1;
        }
      })
      .addCase(createCompanyRevenueHead.rejected, (state, action) => {
        state.createState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to create revenue head.";
      });

    builder
      .addCase(fetchCompanyRevenueHeads.pending, (state) => {
        state.listState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyRevenueHeads.fulfilled, (state, action) => {
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
      .addCase(fetchCompanyRevenueHeads.rejected, (state, action) => {
        state.listState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch revenue heads.";
      });

    builder
      .addCase(fetchCompanyRevenueHeadById.pending, (state) => {
        state.getByIdState = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyRevenueHeadById.fulfilled, (state, action) => {
        state.getByIdState = "succeeded";
        state.selected = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCompanyRevenueHeadById.rejected, (state, action) => {
        state.getByIdState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch revenue head.";
      });

    builder
      .addCase(updateCompanyRevenueHead.pending, (state) => {
        state.updateState = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyRevenueHead.fulfilled, (state, action) => {
        state.updateState = "succeeded";
        const updated: CompanyRevenueHead | undefined =
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
      .addCase(updateCompanyRevenueHead.rejected, (state, action) => {
        state.updateState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to update revenue head.";
      });

    builder
      .addCase(deleteCompanyRevenueHead.pending, (state) => {
        state.deleteState = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyRevenueHead.fulfilled, (state, action) => {
        state.deleteState = "succeeded";
        const deletedId: string | undefined = action.payload?.id;
        if (!deletedId) return;
        state.items = (state.items ?? []).filter((it) => getId(it) !== deletedId);
        if (state.pagination)
          state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteCompanyRevenueHead.rejected, (state, action) => {
        state.deleteState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to delete revenue head.";
      });
  },
});

export const {
  resetCompanyRevenueHeadError,
  clearSelectedCompanyRevenueHead,
  setCompanyRevenueHeadEstate,
} = companyRevenueHeadSlice.actions;
export default companyRevenueHeadSlice.reducer;

export const selectCompanyRevenueHeads = (state: RootState) =>
  (state.companyRevenueHead as CompanyRevenueHeadState)?.items ?? [];
export const selectCompanyRevenueHeadsLoading = (state: RootState) =>
  isPending((state.companyRevenueHead as CompanyRevenueHeadState)?.listState);
export const selectCompanyRevenueHeadsError = (state: RootState) =>
  (state.companyRevenueHead as CompanyRevenueHeadState)?.error ?? null;
export const selectCompanyRevenueHeadsPagination = (state: RootState) =>
  (state.companyRevenueHead as CompanyRevenueHeadState)?.pagination ?? null;
