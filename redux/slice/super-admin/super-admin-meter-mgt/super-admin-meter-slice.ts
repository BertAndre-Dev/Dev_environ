import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EnergyConsumptionPeriod } from "@/lib/energy-consumption-chart";
import type { EstateEnergyUsageRange } from "@/lib/estate-energy-usage-chart";
import { getApiErrorMessage } from "@/lib/api-error";
import {
    assignMeterToEstate,
    getAllMeters,
    removeEstateMeter,
    getMeter,
    getMeterByAddressId,
    deleteMeter
} from './super-admin-meter';

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

interface SuperAdminMeterData {
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


export interface SuperAdminMeterResponse {
  success: boolean;
  message: string;
  data: SuperAdminMeterData[];
  pagination: Pagination;
}


export interface SuperAdminMeterFilters {
  selectedEstateId: string;
  searchInput: string;
  searchQuery: string;
  usageRange: EstateEnergyUsageRange;
  energyPeriod: EnergyConsumptionPeriod;
}

export interface SuperAdminMeterState {
    assignMeterToEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllMetersState: "idle" | "isLoading" | "succeeded" | "failed";
    removeEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterByAddressIdState: "idle" | "isLoading" | "succeeded" | "failed";
    deleteMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    superAdminMeter: SuperAdminMeterData | null;
    allSuperAdminMeter: SuperAdminMeterResponse | null;
    filters: SuperAdminMeterFilters;
    error: string | null;
}


const initialState: SuperAdminMeterState = {
    assignMeterToEstateState: "idle",
    getAllMetersState: "idle",
    removeEstateMeterState: "idle",
    getMeterState: "idle",
    getMeterByAddressIdState: "idle",
    deleteMeterState: "idle",
    status: "idle",
    superAdminMeter: null,
    allSuperAdminMeter: null,
    filters: {
      selectedEstateId: "",
      searchInput: "",
      searchQuery: "",
      usageRange: "weekly",
      energyPeriod: "weekly",
    },
    error: null,
}


const superAdminMeterSlice = createSlice({
    name: 'superAdminMeter',
    initialState,
    reducers: {
        resetSuperAdminMeterState: (state) => {
            state.status = 'idle';
            state.error = null;
        },
        setSuperAdminMeterEstateId: (state, action: PayloadAction<string>) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.selectedEstateId = action.payload?.trim() || "";
        },
        setSuperAdminMeterSearchInput: (state, action: PayloadAction<string>) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.searchInput = action.payload;
        },
        setSuperAdminMeterSearchQuery: (state, action: PayloadAction<string>) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.searchQuery = action.payload;
        },
        applySuperAdminMeterSearch: (state) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.searchQuery = state.filters.searchInput;
        },
        clearSuperAdminMeterSearch: (state) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.searchInput = "";
          state.filters.searchQuery = "";
        },
        setSuperAdminMeterUsageRange: (
          state,
          action: PayloadAction<EstateEnergyUsageRange>,
        ) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.usageRange = action.payload;
        },
        setSuperAdminMeterEnergyPeriod: (
          state,
          action: PayloadAction<EnergyConsumptionPeriod>,
        ) => {
          if (!state.filters) state.filters = { ...initialState.filters };
          state.filters.energyPeriod = action.payload;
        },
    },
    extraReducers(builder) {
        // ✅ ASSIGN METER TO ESTATE & SAVE ON DB
        builder
            .addCase(assignMeterToEstate.pending, (state) => {
                state.assignMeterToEstateState = "isLoading";
            })
            .addCase(assignMeterToEstate.fulfilled, (state, action) => {
                state.assignMeterToEstateState = "succeeded";
                const newMeter = action.payload?.data;
                if (newMeter) {
                    if (state.allSuperAdminMeter?.data) {
                        state.allSuperAdminMeter.data.push(newMeter);
                        state.allSuperAdminMeter.pagination.total += 1;
                    } else {
                        state.allSuperAdminMeter = {
                            success: true,
                            message: "Meter assigned to estate successfully",
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
            .addCase(assignMeterToEstate.rejected, (state, action) => {
                state.assignMeterToEstateState = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });



        // ✅ GET ALL METERS
        builder
            .addCase(getAllMeters.pending, (state) => {
                state.getAllMetersState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllMeters.fulfilled, (state, action) => {
                state.getAllMetersState = "succeeded";
                state.status = "succeeded";

                const pagination = action.payload?.pagination;
                state.allSuperAdminMeter = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "All meters retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: {
                        total: pagination?.total ?? (action.payload?.data?.length ?? 0),
                        currentPage: Number(pagination?.currentPage) || 1,
                        totalPages: Number(pagination?.totalPages) || 1,
                        pageSize: Number(pagination?.pageSize) || 10,
                    },
                };
            })

            .addCase(getAllMeters.rejected, (state, action) => {
                state.getAllMetersState = "failed";
                state.status = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });


        // ✅ REMOVE METER
        builder
            .addCase(removeEstateMeter.pending, (state) => {
                state.removeEstateMeterState = "isLoading";
            })
            .addCase(removeEstateMeter.fulfilled, (state, action) => {
                state.removeEstateMeterState = "succeeded";
                const remove = action.payload?.data;
                if (remove && state.allSuperAdminMeter?.data) {
                    state.allSuperAdminMeter.data = state.allSuperAdminMeter.data.map((meter) =>
                    meter.id === remove.id ? remove : meter
                    );
                }
            })
            .addCase(removeEstateMeter.rejected, (state, action) => {
                state.removeEstateMeterState = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });


        // ✅ GET SINGLE METER
        builder
            .addCase(getMeter.pending, (state) => {
                state.getMeterState = "isLoading";
            })
            .addCase(getMeter.fulfilled, (state, action) => {
                state.getMeterState = "succeeded";
                state.superAdminMeter = action.payload?.data || null;
            })
            .addCase(getMeter.rejected, (state, action) => {
                state.getMeterState = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });

        // ✅ GET METER BY ADDRESS ID (View details)
        builder
            .addCase(getMeterByAddressId.pending, (state) => {
                state.getMeterByAddressIdState = "isLoading";
            })
            .addCase(getMeterByAddressId.fulfilled, (state, action) => {
                state.getMeterByAddressIdState = "succeeded";
                state.superAdminMeter = action.payload?.data ?? null;
            })
            .addCase(getMeterByAddressId.rejected, (state, action) => {
                state.getMeterByAddressIdState = "failed";
                state.superAdminMeter = null;
                state.error = getApiErrorMessage(action.payload) ?? null;
            });


        // ✅ DELETE SINGLE METER
        builder
            .addCase(deleteMeter.pending, (state) => {
                state.deleteMeterState = "isLoading";
            })
            .addCase(deleteMeter.fulfilled, (state, action) => {
                state.deleteMeterState = "succeeded";

                const deletedMeterId = action.meta.arg; // 👈 meterId passed to thunk

                if (state.allSuperAdminMeter?.data) {
                    state.allSuperAdminMeter.data =
                    state.allSuperAdminMeter.data.filter(
                        (meter) => meter.id !== deletedMeterId
                    );

                    // ✅ keep pagination in sync
                    state.allSuperAdminMeter.pagination.total -= 1;
                }
            })

            .addCase(deleteMeter.rejected, (state, action) => {
                state.deleteMeterState = "failed";
                state.error = getApiErrorMessage(action.payload) ?? null;
            });
        
            
    },
});


export const {
  resetSuperAdminMeterState,
  setSuperAdminMeterEstateId,
  setSuperAdminMeterSearchInput,
  setSuperAdminMeterSearchQuery,
  applySuperAdminMeterSearch,
  clearSuperAdminMeterSearch,
  setSuperAdminMeterUsageRange,
  setSuperAdminMeterEnergyPeriod,
} = superAdminMeterSlice.actions;
export default superAdminMeterSlice.reducer;