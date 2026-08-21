import { createSlice } from "@reduxjs/toolkit";
import {
  activateEnergyProviderEstate,
  createEnergyProviderEstate,
  deleteEnergyProviderEstate,
  getEnergyProviderEstateById,
  getEnergyProviderEstates,
  suspendEnergyProviderEstate,
  updateEnergyProviderEstate,
} from "./energy-provider-estate";

export interface EstateDetails {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  modules?: string[];
  createdAt?: string;
  updatedAt?: string;
  id?: string;
  _id?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllEstatesResponse {
  success: boolean;
  message: string;
  data: EstateDetails[];
  pagination: Pagination;
}

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EnergyProviderEstateState {
  activateEstateStatus: AsyncStatus;
  createEstateStatus: AsyncStatus;
  deleteEstateStatus: AsyncStatus;
  getAllEstatesStatus: AsyncStatus;
  getEstateStatus: AsyncStatus;
  suspendEstateStatus: AsyncStatus;
  updateEstateStatus: AsyncStatus;
  estate: EstateDetails | null;
  allEstates: AllEstatesResponse | null;
  error: string | null;
}

const initialState: EnergyProviderEstateState = {
  activateEstateStatus: "idle",
  createEstateStatus: "idle",
  deleteEstateStatus: "idle",
  getAllEstatesStatus: "idle",
  getEstateStatus: "idle",
  suspendEstateStatus: "idle",
  updateEstateStatus: "idle",
  estate: null,
  allEstates: null,
  error: null,
};

function estateId(est: EstateDetails) {
  return est.id || est._id || "";
}

const energyProviderEstateSlice = createSlice({
  name: "energyProviderEstate",
  initialState,
  reducers: {
    clearEnergyProviderEstateError: (state) => {
      state.error = null;
    },
    resetEnergyProviderEstateState: (state) => {
      state.getAllEstatesStatus = "idle";
      state.error = null;
    },
    clearEnergyProviderEstates: (state) => {
      state.allEstates = null;
      state.estate = null;
      state.getAllEstatesStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEnergyProviderEstates.pending, (state) => {
        state.getAllEstatesStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEnergyProviderEstates.fulfilled, (state, action) => {
        state.getAllEstatesStatus = "succeeded";
        const pagination = action.payload?.pagination;
        state.allEstates = {
          success: action.payload?.success ?? true,
          message: action.payload?.message ?? "Estates retrieved successfully",
          data: action.payload?.data ?? [],
          pagination: {
            total: pagination?.total ?? action.payload?.data?.length ?? 0,
            currentPage: Number(pagination?.currentPage) || 1,
            totalPages: Number(pagination?.totalPages) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          },
        };
      })
      .addCase(getEnergyProviderEstates.rejected, (state, action) => {
        state.getAllEstatesStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch estates";
      })
      .addCase(getEnergyProviderEstateById.pending, (state) => {
        state.getEstateStatus = "isLoading";
      })
      .addCase(getEnergyProviderEstateById.fulfilled, (state, action) => {
        state.getEstateStatus = "succeeded";
        state.estate = action.payload?.data ?? null;
      })
      .addCase(getEnergyProviderEstateById.rejected, (state, action) => {
        state.getEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to fetch estate";
      })
      .addCase(createEnergyProviderEstate.pending, (state) => {
        state.createEstateStatus = "isLoading";
      })
      .addCase(createEnergyProviderEstate.fulfilled, (state, action) => {
        state.createEstateStatus = "succeeded";
        const created = action.payload?.data as EstateDetails | undefined;
        if (created && state.allEstates?.data) {
          state.allEstates.data.push(created);
          state.allEstates.pagination.total += 1;
        }
      })
      .addCase(createEnergyProviderEstate.rejected, (state, action) => {
        state.createEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to create estate";
      })
      .addCase(updateEnergyProviderEstate.pending, (state) => {
        state.updateEstateStatus = "isLoading";
      })
      .addCase(updateEnergyProviderEstate.fulfilled, (state, action) => {
        state.updateEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated?.id && state.allEstates?.data) {
          const id = updated.id || updated._id;
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated } : est,
          );
        }
      })
      .addCase(updateEnergyProviderEstate.rejected, (state, action) => {
        state.updateEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to update estate";
      })
      .addCase(deleteEnergyProviderEstate.pending, (state) => {
        state.deleteEstateStatus = "isLoading";
      })
      .addCase(deleteEnergyProviderEstate.fulfilled, (state, action) => {
        state.deleteEstateStatus = "succeeded";
        const deletedId = (action.payload as { deletedId?: string })?.deletedId;
        if (deletedId && state.allEstates?.data) {
          state.allEstates.data = state.allEstates.data.filter(
            (est) => estateId(est) !== deletedId,
          );
          state.allEstates.pagination.total = Math.max(
            0,
            state.allEstates.pagination.total - 1,
          );
        }
      })
      .addCase(deleteEnergyProviderEstate.rejected, (state, action) => {
        state.deleteEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to delete estate";
      })
      .addCase(activateEnergyProviderEstate.pending, (state) => {
        state.activateEstateStatus = "isLoading";
      })
      .addCase(activateEnergyProviderEstate.fulfilled, (state, action) => {
        state.activateEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated && state.allEstates?.data) {
          const id = estateId(updated);
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated, isActive: true } : est,
          );
        }
      })
      .addCase(activateEnergyProviderEstate.rejected, (state, action) => {
        state.activateEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to activate estate";
      })
      .addCase(suspendEnergyProviderEstate.pending, (state) => {
        state.suspendEstateStatus = "isLoading";
      })
      .addCase(suspendEnergyProviderEstate.fulfilled, (state, action) => {
        state.suspendEstateStatus = "succeeded";
        const updated = action.payload?.data as EstateDetails | undefined;
        if (updated && state.allEstates?.data) {
          const id = estateId(updated);
          state.allEstates.data = state.allEstates.data.map((est) =>
            estateId(est) === id ? { ...est, ...updated, isActive: false } : est,
          );
        }
      })
      .addCase(suspendEnergyProviderEstate.rejected, (state, action) => {
        state.suspendEstateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          "Failed to suspend estate";
      });
  },
});

export const {
  clearEnergyProviderEstateError,
  resetEnergyProviderEstateState,
  clearEnergyProviderEstates,
} = energyProviderEstateSlice.actions;
export default energyProviderEstateSlice.reducer;
