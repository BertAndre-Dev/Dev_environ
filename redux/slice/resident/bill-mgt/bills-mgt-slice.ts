import { createSlice } from "@reduxjs/toolkit";
import {
  getBill,
  getBillsByEstate,
  getBillsForAddress,
  getResidentBills,
  payBill,
} from "./bills-mgt";

/** Estate-level payable bill */
export interface EstateBillData {
  id?: string;
  estateId?: string;
  name?: string;
  description?: string;
  yearlyAmount?: number;
  isActive?: boolean;
  createdAt?: string;
}

/** Address-scoped assignment from /for-address */
export interface AssignedBillData {
  id?: string;
  _id?: string;
  billId?: string;
  billName?: string;
  name?: string;
  frequency?: string;
  amountPaid?: number;
  amount?: number;
  yearlyAmount?: number;
  status?: string;
  addressId?: string;
  createdAt?: string;
}

/** Paid bill from /resident/{residentId} */
export interface PaidBillData {
  _id?: string;
  id?: string;
  userId?: string;
  billId?: string;
  billName?: string;
  addressId?: string;
  frequency?: string;
  amountPaid?: number;
  lastPaymentDate?: string | null;
  startDate?: string;
  nextDueDate?: string;
  status?: string;
  isServiceCharge?: boolean;
}

export interface Pagination {
  total: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface PaginatedBills<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface ResidentBillState {
  getBillState: "idle" | "isLoading" | "succeeded" | "failed";
  getBillsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  getBillsForAddressState: "idle" | "isLoading" | "succeeded" | "failed";
  getResidentBillsState: "idle" | "isLoading" | "succeeded" | "failed";
  payBillState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  residentBill: EstateBillData | null;
  estateBills: PaginatedBills<EstateBillData> | null;
  assignedBills: PaginatedBills<AssignedBillData> | null;
  paidBills: PaginatedBills<PaidBillData> | null;
  error: string | null;
}

const emptyPagination = (total = 0): Pagination => ({
  total,
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  page: 1,
  limit: 10,
  pages: 1,
});

const initialState: ResidentBillState = {
  getBillState: "idle",
  getBillsByEstateState: "idle",
  getBillsForAddressState: "idle",
  getResidentBillsState: "idle",
  payBillState: "idle",
  status: "idle",
  residentBill: null,
  estateBills: null,
  assignedBills: null,
  paidBills: null,
  error: null,
};

const residentBillSlice = createSlice({
  name: "residentBill",
  initialState,
  reducers: {
    resetResidentBillState: (state) => {
      state.status = "idle";
      state.error = null;
    },
    clearAssignedBills: (state) => {
      state.assignedBills = null;
    },
  },
  extraReducers(builder) {
    // GET BILLS BY ESTATE
    builder
      .addCase(getBillsByEstate.pending, (state) => {
        state.getBillsByEstateState = "isLoading";
      })
      .addCase(getBillsByEstate.fulfilled, (state, action) => {
        state.getBillsByEstateState = "succeeded";
        state.estateBills = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ?? "Bills retrieved successfully.",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || emptyPagination(
            action.payload?.data?.length ?? 0,
          ),
        };
      })
      .addCase(getBillsByEstate.rejected, (state, action) => {
        state.getBillsByEstateState = "failed";
        state.error =
          action.error.message || "Failed to fetch bills for estate";
      });

    // GET BILLS FOR ADDRESS
    builder
      .addCase(getBillsForAddress.pending, (state) => {
        state.getBillsForAddressState = "isLoading";
      })
      .addCase(getBillsForAddress.fulfilled, (state, action) => {
        state.getBillsForAddressState = "succeeded";
        state.assignedBills = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Bills retrieved successfully for this address.",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || emptyPagination(
            action.payload?.data?.length ?? 0,
          ),
        };
      })
      .addCase(getBillsForAddress.rejected, (state, action) => {
        state.getBillsForAddressState = "failed";
        state.error =
          action.error.message || "Failed to fetch bills for address";
      });

    // GET RESIDENT PAID BILLS
    builder
      .addCase(getResidentBills.pending, (state) => {
        state.getResidentBillsState = "isLoading";
      })
      .addCase(getResidentBills.fulfilled, (state, action) => {
        state.getResidentBillsState = "succeeded";
        state.paidBills = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Resident paid bills retrieved successfully.",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || emptyPagination(
            action.payload?.data?.length ?? 0,
          ),
        };
      })
      .addCase(getResidentBills.rejected, (state, action) => {
        state.getResidentBillsState = "failed";
        state.error =
          action.error.message || "Failed to fetch resident paid bills";
      });

    // GET SINGLE BILL
    builder
      .addCase(getBill.pending, (state) => {
        state.getBillState = "isLoading";
      })
      .addCase(getBill.fulfilled, (state, action) => {
        state.getBillState = "succeeded";
        state.residentBill = action.payload?.data || null;
      })
      .addCase(getBill.rejected, (state, action) => {
        state.getBillState = "failed";
        state.error = action.error.message || "Failed to fetch bill";
      });

    // PAY BILL
    builder
      .addCase(payBill.pending, (state) => {
        state.payBillState = "isLoading";
      })
      .addCase(payBill.fulfilled, (state) => {
        state.payBillState = "succeeded";
      })
      .addCase(payBill.rejected, (state, action) => {
        state.payBillState = "failed";
        state.error = action.error.message || "Failed to pay bill";
      });
  },
});

export const { resetResidentBillState, clearAssignedBills } =
  residentBillSlice.actions;
export default residentBillSlice.reducer;
