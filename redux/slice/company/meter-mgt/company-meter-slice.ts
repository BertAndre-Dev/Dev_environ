import { createSlice } from "@reduxjs/toolkit";
import {
  addCompanyMeter,
  deleteCompanyMeter,
  getCompanyMeterByAddressId,
  getCompanyMeters,
  removeCompanyEstateMeter,
} from "./company-meter";

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

export interface CompanyMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  companyId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: string | { id: string; data?: Record<string, unknown> };
  vendorData?: VendorData;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface CompanyMeterListResponse {
  success: boolean;
  message: string;
  data: CompanyMeterData[];
  pagination: Pagination;
}

export interface CompanyMeterState {
  addMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  getMetersState: "idle" | "isLoading" | "succeeded" | "failed";
  removeEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  getMeterByAddressIdState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  meterDetails: CompanyMeterData | null;
  meterList: CompanyMeterListResponse | null;
  error: string | null;
}

const initialState: CompanyMeterState = {
  addMeterState: "idle",
  getMetersState: "idle",
  removeEstateMeterState: "idle",
  getMeterByAddressIdState: "idle",
  deleteMeterState: "idle",
  meterDetails: null,
  meterList: null,
  error: null,
};

const companyMeterSlice = createSlice({
  name: "companyMeter",
  initialState,
  reducers: {
    resetCompanyMeterState: (state) => {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(addCompanyMeter.pending, (state) => {
        state.addMeterState = "isLoading";
      })
      .addCase(addCompanyMeter.fulfilled, (state, action) => {
        state.addMeterState = "succeeded";
        const newMeter = action.payload?.data;
        if (newMeter) {
          if (state.meterList?.data) {
            state.meterList.data.push(newMeter);
            state.meterList.pagination.total += 1;
          } else {
            state.meterList = {
              success: true,
              message: "Meter added successfully",
              data: [newMeter],
              pagination: {
                total: 1,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
              },
            };
          }
        }
      })
      .addCase(addCompanyMeter.rejected, (state, action) => {
        state.addMeterState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to add meter";
      });

    builder
      .addCase(getCompanyMeters.pending, (state) => {
        state.getMetersState = "isLoading";
      })
      .addCase(getCompanyMeters.fulfilled, (state, action) => {
        state.getMetersState = "succeeded";
        const pagination = action.payload?.pagination;
        state.meterList = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ?? "All meters retrieved successfully.",
          data: action.payload?.data || [],
          pagination: {
            total: pagination?.total ?? (action.payload?.data?.length ?? 0),
            currentPage: Number(pagination?.currentPage) || 1,
            totalPages: Number(pagination?.totalPages) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          },
        };
      })
      .addCase(getCompanyMeters.rejected, (state, action) => {
        state.getMetersState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch meters";
      });

    builder
      .addCase(removeCompanyEstateMeter.pending, (state) => {
        state.removeEstateMeterState = "isLoading";
      })
      .addCase(removeCompanyEstateMeter.fulfilled, (state, action) => {
        state.removeEstateMeterState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.meterList?.data) {
          state.meterList.data = state.meterList.data.map((meter) =>
            meter.id === updated.id ? updated : meter,
          );
        }
      })
      .addCase(removeCompanyEstateMeter.rejected, (state, action) => {
        state.removeEstateMeterState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to remove meter";
      });

    builder
      .addCase(getCompanyMeterByAddressId.pending, (state) => {
        state.getMeterByAddressIdState = "isLoading";
      })
      .addCase(getCompanyMeterByAddressId.fulfilled, (state, action) => {
        state.getMeterByAddressIdState = "succeeded";
        state.meterDetails = action.payload?.data ?? null;
      })
      .addCase(getCompanyMeterByAddressId.rejected, (state, action) => {
        state.getMeterByAddressIdState = "failed";
        state.meterDetails = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to fetch meter details";
      });

    builder
      .addCase(deleteCompanyMeter.pending, (state) => {
        state.deleteMeterState = "isLoading";
      })
      .addCase(deleteCompanyMeter.fulfilled, (state, action) => {
        state.deleteMeterState = "succeeded";
        const deletedMeterId = action.meta.arg;
        if (state.meterList?.data) {
          state.meterList.data = state.meterList.data.filter(
            (meter) => meter.id !== deletedMeterId,
          );
          state.meterList.pagination.total -= 1;
        }
      })
      .addCase(deleteCompanyMeter.rejected, (state, action) => {
        state.deleteMeterState = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Failed to delete meter";
      });
  },
});

export const { resetCompanyMeterState } = companyMeterSlice.actions;
export default companyMeterSlice.reducer;
