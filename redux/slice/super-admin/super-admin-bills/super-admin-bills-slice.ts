import { createSlice } from "@reduxjs/toolkit";
import { getBillsByEstate } from "./super-admin-bills";

export type BillItem = {
  id?: string;
  _id?: string;
  estateId?: string;
  name?: string;
  description?: string;
  yearlyAmount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BillsPagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type BillsResponse = {
  success?: boolean;
  message?: string;
  data: BillItem[];
  pagination: BillsPagination;
};

export type SuperAdminBillsState = {
  getBillsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  bills: BillsResponse | null;
  error: string | null;
};

const initialState: SuperAdminBillsState = {
  getBillsByEstateState: "idle",
  bills: null,
  error: null,
};

function normalizePagination(
  pagination: Record<string, unknown> | undefined,
  dataLength: number,
  requestedPage: number,
  requestedLimit: number,
): BillsPagination {
  const pageSize =
    Number(
      pagination?.limit ??
        pagination?.pageSize ??
        requestedLimit,
    ) || requestedLimit;
  const total = Number(pagination?.total ?? dataLength) || 0;
  const page =
    Number(
      pagination?.page ??
        pagination?.currentPage ??
        requestedPage,
    ) || requestedPage;
  const pages =
    Number(pagination?.pages ?? pagination?.totalPages) ||
    Math.max(1, Math.ceil(Math.max(total, 1) / pageSize));

  return { total, page, limit: pageSize, pages };
}

const superAdminBillsSlice = createSlice({
  name: "superAdminBills",
  initialState,
  reducers: {
    resetBillsState: (state) => {
      state.getBillsByEstateState = "idle";
      state.bills = null;
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getBillsByEstate.pending, (state) => {
        state.getBillsByEstateState = "isLoading";
        state.error = null;
      })
      .addCase(getBillsByEstate.fulfilled, (state, action) => {
        state.getBillsByEstateState = "succeeded";
        const data = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
        const requestedPage = Number(action.meta.arg?.page) || 1;
        const requestedLimit = Number(action.meta.arg?.limit) || 10;
        state.bills = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ?? "Bills retrieved successfully",
          data,
          pagination: normalizePagination(
            action.payload?.pagination,
            data.length,
            requestedPage,
            requestedLimit,
          ),
        };
      })
      .addCase(getBillsByEstate.rejected, (state, action) => {
        state.getBillsByEstateState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch bills";
        state.bills = null;
      });
  },
});

export const { resetBillsState } = superAdminBillsSlice.actions;
export default superAdminBillsSlice.reducer;
