import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  addCompanyMeter,
  assignCompanyMeterToEstate,
  deleteCompanyMeter,
  getCompanyMeterByAddressId,
  getCompanyMeters,
  removeCompanyEstateMeter,
} from "./company-meter";

/** Path param for GET /meters/estate/{id} when listing company-pool meters. */
export const ALL_METERS_ESTATE_ID = "all";

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
  addressId?: string | { id: string; data?: Record<string, unknown> };
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

export interface CompanyMeterFilters {
  selectedEstateId: string;
  searchInput: string;
  searchQuery: string;
  usageRange: EstateEnergyUsageRange;
  energyPeriod: EnergyConsumptionPeriod;
}

export interface CompanyMeterState {
  addMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  getMetersState: "idle" | "isLoading" | "succeeded" | "failed";
  removeEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  assignMeterToEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  getMeterByAddressIdState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteMeterState: "idle" | "isLoading" | "succeeded" | "failed";
  meterDetails: CompanyMeterData | null;
  meterList: CompanyMeterListResponse | null;
  filters: CompanyMeterFilters;
  error: string | null;
}

const initialState: CompanyMeterState = {
  addMeterState: "idle",
  getMetersState: "idle",
  removeEstateMeterState: "idle",
  assignMeterToEstateState: "idle",
  getMeterByAddressIdState: "idle",
  deleteMeterState: "idle",
  meterDetails: null,
  meterList: null,
  filters: {
    selectedEstateId: ALL_METERS_ESTATE_ID,
    searchInput: "",
    searchQuery: "",
    usageRange: "weekly",
    energyPeriod: "weekly",
  },
  error: null,
};

const companyMeterSlice = createSlice({
  name: "companyMeter",
  initialState,
  reducers: {
    resetCompanyMeterState: (state) => {
      state.error = null;
    },
    setCompanyMeterEstateId: (state, action: PayloadAction<string>) => {
      state.filters.selectedEstateId =
        action.payload?.trim() || ALL_METERS_ESTATE_ID;
    },
    setCompanyMeterSearchInput: (state, action: PayloadAction<string>) => {
      state.filters.searchInput = action.payload;
    },
    setCompanyMeterSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    },
    applyCompanyMeterSearch: (state) => {
      state.filters.searchQuery = state.filters.searchInput;
    },
    clearCompanyMeterSearch: (state) => {
      state.filters.searchInput = "";
      state.filters.searchQuery = "";
    },
    setCompanyMeterUsageRange: (
      state,
      action: PayloadAction<EstateEnergyUsageRange>,
    ) => {
      state.filters.usageRange = action.payload;
    },
    setCompanyMeterEnergyPeriod: (
      state,
      action: PayloadAction<EnergyConsumptionPeriod>,
    ) => {
      state.filters.energyPeriod = action.payload;
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
        state.error = getApiErrorMessage(action.payload) ?? null;
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
        state.error = getApiErrorMessage(action.payload) ?? null;
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
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(assignCompanyMeterToEstate.pending, (state) => {
        state.assignMeterToEstateState = "isLoading";
        state.error = null;
      })
      .addCase(assignCompanyMeterToEstate.fulfilled, (state, action) => {
        state.assignMeterToEstateState = "succeeded";
        const updated = action.payload?.data as CompanyMeterData | undefined;
        const meterNumber =
          updated?.meterNumber ?? action.meta.arg.meterNumber;
        if (!meterNumber || !state.meterList?.data) return;

        const unassign = action.meta.arg.unassign === true;
        state.meterList.data = state.meterList.data.map((meter) => {
          if (
            meter.meterNumber !== meterNumber &&
            meter.id !== updated?.id
          ) {
            return meter;
          }
          return {
            ...meter,
            ...(updated && typeof updated === "object" ? updated : {}),
            isAssigned: unassign
              ? false
              : (updated?.isAssigned ?? true),
            ...(unassign ? { addressId: undefined } : {}),
          };
        });
      })
      .addCase(assignCompanyMeterToEstate.rejected, (state, action) => {
        state.assignMeterToEstateState = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
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
        state.error = getApiErrorMessage(action.payload) ?? null;
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
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const {
  resetCompanyMeterState,
  setCompanyMeterEstateId,
  setCompanyMeterSearchInput,
  setCompanyMeterSearchQuery,
  applyCompanyMeterSearch,
  clearCompanyMeterSearch,
  setCompanyMeterUsageRange,
  setCompanyMeterEnergyPeriod,
} = companyMeterSlice.actions;
export default companyMeterSlice.reducer;
