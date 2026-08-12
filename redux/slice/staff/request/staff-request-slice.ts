import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createStaffRequest,
  getStaffRequestCategories,
  getStaffRequests,
  type StaffRequestCategory,
  type StaffRequestItem,
  type StaffRequestStatus,
} from "./staff-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface StaffRequestUiState {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: StaffRequestStatus | "";
}

interface StaffRequestState {
  list: StaffRequestItem[];
  categories: StaffRequestCategory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  } | null;
  ui: StaffRequestUiState;
  getListStatus: AsyncStatus;
  getCategoriesStatus: AsyncStatus;
  createStatus: AsyncStatus;
  error: string | null;
}

const initialState: StaffRequestState = {
  list: [],
  categories: [],
  pagination: null,
  ui: {
    page: 1,
    pageSize: 10,
    search: "",
    statusFilter: "",
  },
  getListStatus: "idle",
  getCategoriesStatus: "idle",
  createStatus: "idle",
  error: null,
};

const staffRequestSlice = createSlice({
  name: "staffRequest",
  initialState,
  reducers: {
    setStaffRequestSearch: (state, action: PayloadAction<string>) => {
      state.ui.search = action.payload;
      state.ui.page = 1;
    },
    setStaffRequestStatusFilter: (
      state,
      action: PayloadAction<StaffRequestStatus | "">,
    ) => {
      state.ui.statusFilter = action.payload;
      state.ui.page = 1;
    },
    setStaffRequestPage: (state, action: PayloadAction<number>) => {
      state.ui.page = action.payload;
    },
    clearStaffRequestError: (state) => {
      state.error = null;
    },
    resetStaffRequestCreateStatus: (state) => {
      state.createStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffRequests.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffRequests.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.list = action.payload.list;
        state.pagination = action.payload.pagination;
      })
      .addCase(getStaffRequests.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch requests";
      })
      .addCase(getStaffRequestCategories.pending, (state) => {
        state.getCategoriesStatus = "isLoading";
      })
      .addCase(getStaffRequestCategories.fulfilled, (state, action) => {
        state.getCategoriesStatus = "succeeded";
        state.categories = action.payload;
      })
      .addCase(getStaffRequestCategories.rejected, (state, action) => {
        state.getCategoriesStatus = "failed";
        state.categories = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request categories";
      })
      .addCase(createStaffRequest.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createStaffRequest.fulfilled, (state) => {
        state.createStatus = "succeeded";
      })
      .addCase(createStaffRequest.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to create request";
      });
  },
});

export const {
  setStaffRequestSearch,
  setStaffRequestStatusFilter,
  setStaffRequestPage,
  clearStaffRequestError,
  resetStaffRequestCreateStatus,
} = staffRequestSlice.actions;

export default staffRequestSlice.reducer;
