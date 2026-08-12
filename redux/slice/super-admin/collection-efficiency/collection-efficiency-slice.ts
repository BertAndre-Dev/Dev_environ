import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  AnalyticsScope,
  CollectionEfficiencyData,
} from "@/types/analytics";
import { getCollectionEfficiency } from "./collection-efficiency";

export interface CollectionEfficiencyState {
  data: CollectionEfficiencyData | null;
  scope: AnalyticsScope | null;
  status: "idle" | "isLoading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CollectionEfficiencyState = {
  data: null,
  scope: null,
  status: "idle",
  error: null,
};

const collectionEfficiencySlice = createSlice({
  name: "superAdminCollectionEfficiency",
  initialState,
  reducers: {
    clearCollectionEfficiency: (state) => {
      state.data = null;
      state.scope = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCollectionEfficiency.pending, (state) => {
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(getCollectionEfficiency.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload?.data ?? null;
        state.scope = action.payload?.scope ?? null;
        state.error = null;
      })
      .addCase(getCollectionEfficiency.rejected, (state, action) => {
        state.status = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const { clearCollectionEfficiency } = collectionEfficiencySlice.actions;

export const selectCollectionEfficiencyData = (state: RootState) =>
  state.superAdminCollectionEfficiency.data;
export const selectCollectionEfficiencyLoading = (state: RootState) =>
  state.superAdminCollectionEfficiency.status === "isLoading";
export const selectCollectionEfficiencyError = (state: RootState) =>
  state.superAdminCollectionEfficiency.error;
export const selectCollectionEfficiencyStatus = (state: RootState) =>
  state.superAdminCollectionEfficiency.status;
export const selectCollectionEfficiencyScope = (state: RootState) =>
  state.superAdminCollectionEfficiency.scope;

export default collectionEfficiencySlice.reducer;
