import { createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Designation, DesignationPagination } from "@/lib/designations";
import { isPending } from "@/lib/async-status";
import type { RootState } from "@/redux/store";
import {
  createDesignation,
  deleteDesignation,
  getDesignationById,
  getDesignations,
  updateDesignation,
} from "./designations";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface DesignationsState {
  items: Designation[];
  selected: Designation | null;
  pagination: DesignationPagination | null;
  listStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: DesignationsState = {
  items: [],
  selected: null,
  pagination: null,
  listStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

function upsertItem(items: Designation[], next: Designation): Designation[] {
  const exists = items.some((item) => item.id === next.id);
  if (!exists) return [next, ...items];
  return items.map((item) => (item.id === next.id ? { ...item, ...next } : item));
}

const designationsSlice = createSlice({
  name: "designations",
  initialState,
  reducers: {
    clearDesignationsError: (state) => {
      state.error = null;
    },
    clearSelectedDesignation: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDesignations.pending, (state) => {
        state.listStatus = "isLoading";
        state.error = null;
      })
      .addCase(getDesignations.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(getDesignations.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to load designations.";
      })
      .addCase(createDesignation.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createDesignation.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.items = upsertItem(state.items, action.payload.item);
        if (state.pagination) state.pagination.total += 1;
      })
      .addCase(createDesignation.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to create designation.";
      })
      .addCase(updateDesignation.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateDesignation.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const next = action.payload.item;
        state.items = upsertItem(state.items, next);
        if (state.selected?.id === next.id) {
          state.selected = { ...state.selected, ...next };
        }
      })
      .addCase(updateDesignation.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to update designation.";
      })
      .addCase(deleteDesignation.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteDesignation.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.items = state.items.filter((item) => item.id !== action.payload.id);
        if (state.selected?.id === action.payload.id) state.selected = null;
        if (state.pagination) {
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      })
      .addCase(deleteDesignation.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to delete designation.";
      })
      .addCase(getDesignationById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getDesignationById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.selected = action.payload.item;
        state.items = upsertItem(state.items, action.payload.item);
      })
      .addCase(getDesignationById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.error =
          getApiErrorMessage(action.payload) ??
          action.error.message ??
          "Failed to load designation.";
      });
  },
});

export const { clearDesignationsError, clearSelectedDesignation } =
  designationsSlice.actions;

export default designationsSlice.reducer;

export const selectDesignationsState = (state: RootState) =>
  state.designations as DesignationsState;

export const selectDesignations = (state: RootState) =>
  selectDesignationsState(state).items;

export const selectDesignationsPagination = (state: RootState) =>
  selectDesignationsState(state).pagination;

export const selectDesignationsListLoading = (state: RootState) =>
  isPending(selectDesignationsState(state).listStatus);

export const selectDesignationsError = (state: RootState) =>
  selectDesignationsState(state).error;
