import { createSlice } from "@reduxjs/toolkit";
import {
    assignMeterToAddress,
    getAllEstateMeter,
    getMeter,
    getVendingStatsByEstate,
    getEstateVendLimits,
    setEstateVendLimits,
    type VendingStatsByEstateData,
    type EstateVendLimitsData,
} from './meter-mgt';


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

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string; 
  updatedAt?: string; 
  addressId: string;
  vendorData?: VendorData;
}


export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}


export interface AdminMeterResponse {
  success: boolean;
  message: string;
  data: AdminMeterData[];
  pagination: Pagination;
}


export interface AdminMeterState {
    assignMeterToAddressState: "idle" | "isLoading" | "succeeded" | "failed";
    getAllEstateMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getMeterState: "idle" | "isLoading" | "succeeded" | "failed";
    getVendingStatsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
    getEstateVendLimitsState: "idle" | "isLoading" | "succeeded" | "failed";
    setEstateVendLimitsState: "idle" | "isLoading" | "succeeded" | "failed";
    status: "idle" | "isLoading" | "succeeded" | "failed";
    adminMeter: AdminMeterData | null;
    allAdminMeters: AdminMeterResponse | null;
    vendingStatsByEstate: VendingStatsByEstateData | null;
    vendLimits: EstateVendLimitsData | null;
    error: string | null;
}


const initialState: AdminMeterState = {
    assignMeterToAddressState: "idle",
    getAllEstateMeterState: "idle",
    getMeterState: "idle",
    getVendingStatsByEstateState: "idle",
    getEstateVendLimitsState: "idle",
    setEstateVendLimitsState: "idle",
    status: "idle",
    adminMeter: null,
    allAdminMeters: null,
    vendingStatsByEstate: null,
    vendLimits: null,
    error: null,
}


const adminMeterSlice = createSlice({
    name: 'staffMeter',
    initialState,
    reducers: {
        resetAdminMeterState: (state) => {
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers(builder) {
        // ✅ ASSIGN METER TO ADDRESS
        builder
            .addCase(assignMeterToAddress.pending, (state) => {
                state.assignMeterToAddressState = "isLoading";
            })
            .addCase(assignMeterToAddress.fulfilled, (state, action) => {
                state.assignMeterToAddressState = "succeeded";
                const updated = action.payload?.data;
                const meterNumber =
                    updated?.meterNumber ?? action.meta.arg.meterNumber;
                if (!meterNumber || !state.allAdminMeters?.data) return;

                const idx = state.allAdminMeters.data.findIndex(
                    (m) => m.meterNumber === meterNumber,
                );
                if (idx === -1) return;

                const unassign = action.meta.arg.unassign === true;
                const existing = state.allAdminMeters.data[idx];
                state.allAdminMeters.data[idx] = {
                    ...existing,
                    ...(updated && typeof updated === "object" ? updated : {}),
                    isAssigned: unassign
                        ? false
                        : (updated?.isAssigned ?? true),
                    ...(unassign ? { addressId: "" } : {}),
                };
            })
            .addCase(assignMeterToAddress.rejected, (state, action) => {
                state.assignMeterToAddressState = "failed";
                state.error =
                    (action.payload as { message?: string } | undefined)?.message ||
                    action.error.message ||
                    "Failed to assign or unassign meter";
            });


        // ✅ GET SINGLE METER
        builder
            .addCase(getMeter.pending, (state) => {
                state.getMeterState = "isLoading";
            })
            .addCase(getMeter.fulfilled, (state, action) => {
                state.getMeterState = "succeeded";
                state.adminMeter = action.payload?.data || null;
            })
            .addCase(getMeter.rejected, (state, action) => {
                state.getMeterState = "failed";
                state.error = action.error.message || "Failed to fetch meter";
            });



        // ✅ GET ESTATE METERS
        builder
            .addCase(getAllEstateMeter.pending, (state) => {
                state.getAllEstateMeterState = "isLoading";
                state.status = "isLoading";
            })
            .addCase(getAllEstateMeter.fulfilled, (state, action) => {
                state.getAllEstateMeterState = "succeeded";
                state.status = "succeeded";

                const pagination = action.payload?.pagination;
                state.allAdminMeters = {
                    success: action.payload?.success ?? true,
                    message: action.payload?.message ?? "Estate meters retrieved successfully.",
                    data: action.payload?.data || [],
                    pagination: {
                        total: pagination?.total ?? (action.payload?.data?.length ?? 0),
                        currentPage: Number(pagination?.currentPage) || 1,
                        totalPages: Number(pagination?.totalPages) || 1,
                        pageSize: Number(pagination?.pageSize) || 10,
                    },
                };
            })
            .addCase(getAllEstateMeter.rejected, (state, action) => {
                state.getAllEstateMeterState = "failed";
                state.status = "failed";
                state.error = action.error.message || "Failed to fetch estate meters";
            });

        builder
            .addCase(getVendingStatsByEstate.pending, (state) => {
                state.getVendingStatsByEstateState = "isLoading";
                state.vendingStatsByEstate = null;
            })
            .addCase(getVendingStatsByEstate.fulfilled, (state, action) => {
                state.getVendingStatsByEstateState = "succeeded";
                state.vendingStatsByEstate = action.payload?.data ?? null;
            })
            .addCase(getVendingStatsByEstate.rejected, (state, action) => {
                state.getVendingStatsByEstateState = "failed";
                state.vendingStatsByEstate = null;
                state.error =
                    (action.payload as { message?: string } | undefined)?.message ||
                    action.error.message ||
                    "Failed to fetch vending statistics";
            });

        // ✅ GET ESTATE VEND LIMITS
        builder
            .addCase(getEstateVendLimits.pending, (state) => {
                state.getEstateVendLimitsState = "isLoading";
                state.error = null;
            })
            .addCase(getEstateVendLimits.fulfilled, (state, action) => {
                state.getEstateVendLimitsState = "succeeded";
                state.vendLimits = action.payload?.data ?? null;
            })
            .addCase(getEstateVendLimits.rejected, (state, action) => {
                state.getEstateVendLimitsState = "failed";
                state.vendLimits = null;
                state.error =
                    (action.payload as { message?: string } | undefined)?.message ||
                    action.error.message ||
                    null;
            });

        // ✅ SET ESTATE VEND LIMITS
        builder
            .addCase(setEstateVendLimits.pending, (state) => {
                state.setEstateVendLimitsState = "isLoading";
                state.error = null;
            })
            .addCase(setEstateVendLimits.fulfilled, (state, action) => {
                state.setEstateVendLimitsState = "succeeded";
                state.vendLimits = action.payload?.data ?? state.vendLimits;
            })
            .addCase(setEstateVendLimits.rejected, (state, action) => {
                state.setEstateVendLimitsState = "failed";
                state.error =
                    (action.payload as { message?: string } | undefined)?.message ||
                    action.error.message ||
                    null;
            });
    },
});


export const { resetAdminMeterState } = adminMeterSlice.actions;
export default adminMeterSlice.reducer;
