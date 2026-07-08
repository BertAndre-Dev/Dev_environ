import { createSlice } from "@reduxjs/toolkit";
import {
  createEnergyProviderEntry,
  deleteEnergyProviderEntry,
  getEnergyProviderEntriesByField,
  getEnergyProviderEntry,
  getEnergyProviderEntryStats,
  updateEnergyProviderEntry,
} from "./energy-provider-entry";

interface EntryData {
  estateId: string;
  fieldId: string;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllEntryResponse {
  success: boolean;
  message: string;
  data: EntryData[];
  pagination: Pagination;
}

export interface EntryStats {
  totalEntries: number;
  recentEntries: number;
  [key: string]: unknown;
}

export interface EnergyProviderEntryState {
  createEntryState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteEntryState: "idle" | "isLoading" | "succeeded" | "failed";
  getEntryState: "idle" | "isLoading" | "succeeded" | "failed";
  updateEntryState: "idle" | "isLoading" | "succeeded" | "failed";
  getEntriesByFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  getEntryStatsState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  entry: EntryData | null;
  allEntry: AllEntryResponse | null;
  stats: Record<string, EntryStats>;
  error: string | null;
}

const initialState: EnergyProviderEntryState = {
  createEntryState: "idle",
  deleteEntryState: "idle",
  getEntryState: "idle",
  updateEntryState: "idle",
  getEntriesByFieldState: "idle",
  getEntryStatsState: "idle",
  status: "idle",
  entry: null,
  allEntry: null,
  stats: {},
  error: null,
};

const energyProviderEntrySlice = createSlice({
  name: "energyProviderEntry",
  initialState,
  reducers: {
    resetEnergyProviderEntryState: (state) => {
      state.status = "idle";
      state.error = null;
    },
    clearEnergyProviderEntries: (state) => {
      state.allEntry = null;
      state.entry = null;
      state.stats = {};
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getEnergyProviderEntriesByField.pending, (state) => {
        state.getEntriesByFieldState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getEnergyProviderEntriesByField.fulfilled, (state, action) => {
        state.getEntriesByFieldState = "succeeded";
        state.status = "succeeded";
        state.allEntry = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ?? "Field entries retrieved successfully",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || {
            total: 0,
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
          },
        };
      })
      .addCase(getEnergyProviderEntriesByField.rejected, (state, action) => {
        state.getEntriesByFieldState = "failed";
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch field entries";
      });

    builder
      .addCase(getEnergyProviderEntry.pending, (state) => {
        state.getEntryState = "isLoading";
      })
      .addCase(getEnergyProviderEntry.fulfilled, (state, action) => {
        state.getEntryState = "succeeded";
        state.entry = action.payload?.data || null;
      })
      .addCase(getEnergyProviderEntry.rejected, (state, action) => {
        state.getEntryState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch entry";
      });

    builder
      .addCase(createEnergyProviderEntry.pending, (state) => {
        state.createEntryState = "isLoading";
      })
      .addCase(createEnergyProviderEntry.fulfilled, (state, action) => {
        state.createEntryState = "succeeded";
        if (action.payload?.data) {
          if (state.allEntry?.data) {
            state.allEntry.data.push(action.payload.data);
            state.allEntry.pagination.total += 1;
          } else {
            state.allEntry = {
              success: true,
              message: "Field entry created successfully",
              data: [action.payload.data],
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
      .addCase(createEnergyProviderEntry.rejected, (state, action) => {
        state.createEntryState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to create field entry";
      });

    builder
      .addCase(updateEnergyProviderEntry.pending, (state) => {
        state.updateEntryState = "isLoading";
      })
      .addCase(updateEnergyProviderEntry.fulfilled, (state, action) => {
        state.updateEntryState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allEntry?.data) {
          state.allEntry.data = state.allEntry.data.map((entry) =>
            entry.id === updated.id ? updated : entry,
          );
        }
      })
      .addCase(updateEnergyProviderEntry.rejected, (state, action) => {
        state.updateEntryState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update field entry";
      });

    builder
      .addCase(deleteEnergyProviderEntry.pending, (state) => {
        state.deleteEntryState = "isLoading";
      })
      .addCase(deleteEnergyProviderEntry.fulfilled, (state, action) => {
        state.deleteEntryState = "succeeded";
        const deletedId = action.meta.arg;
        if (state.allEntry?.data) {
          state.allEntry.data = state.allEntry.data.filter(
            (entry) => entry.id !== deletedId,
          );
          state.allEntry.pagination.total -= 1;
        }
      })
      .addCase(deleteEnergyProviderEntry.rejected, (state, action) => {
        state.deleteEntryState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to delete field entry";
      });

    builder
      .addCase(getEnergyProviderEntryStats.pending, (state) => {
        state.getEntryStatsState = "isLoading";
      })
      .addCase(getEnergyProviderEntryStats.fulfilled, (state, action) => {
        state.getEntryStatsState = "succeeded";
        const fieldId =
          typeof action.meta.arg === "string" ? action.meta.arg : "";
        if (fieldId) {
          state.stats[fieldId] = action.payload?.data || {};
        }
      })
      .addCase(getEnergyProviderEntryStats.rejected, (state, action) => {
        state.getEntryStatsState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch entry stats";
      });
  },
});

export const { resetEnergyProviderEntryState, clearEnergyProviderEntries } =
  energyProviderEntrySlice.actions;
export default energyProviderEntrySlice.reducer;
