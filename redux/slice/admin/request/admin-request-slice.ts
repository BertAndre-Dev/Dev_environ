import { createSlice } from "@reduxjs/toolkit";
import {
  getAdminRequestWorkflow,
  upsertAdminRequestWorkflow,
  type RequestWorkflow,
} from "./admin-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface AdminRequestState {
  workflow: RequestWorkflow | null;
  getWorkflowStatus: AsyncStatus;
  upsertWorkflowStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminRequestState = {
  workflow: null,
  getWorkflowStatus: "idle",
  upsertWorkflowStatus: "idle",
  error: null,
};

const adminRequestSlice = createSlice({
  name: "adminRequest",
  initialState,
  reducers: {
    clearAdminRequestError: (state) => {
      state.error = null;
    },
    resetAdminRequestUpsertStatus: (state) => {
      state.upsertWorkflowStatus = "idle";
    },
    clearAdminRequestWorkflow: (state) => {
      state.workflow = null;
      state.getWorkflowStatus = "idle";
      state.upsertWorkflowStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAdminRequestWorkflow.pending, (state) => {
        state.getWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAdminRequestWorkflow.fulfilled, (state, action) => {
        state.getWorkflowStatus = "succeeded";
        state.workflow = action.payload;
      })
      .addCase(getAdminRequestWorkflow.rejected, (state, action) => {
        state.getWorkflowStatus = "failed";
        state.workflow = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request workflow";
      })
      .addCase(upsertAdminRequestWorkflow.pending, (state) => {
        state.upsertWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(upsertAdminRequestWorkflow.fulfilled, (state, action) => {
        state.upsertWorkflowStatus = "succeeded";
        if (action.payload) {
          state.workflow = action.payload;
        }
      })
      .addCase(upsertAdminRequestWorkflow.rejected, (state, action) => {
        state.upsertWorkflowStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to save request workflow";
      });
  },
});

export const {
  clearAdminRequestError,
  resetAdminRequestUpsertStatus,
  clearAdminRequestWorkflow,
} = adminRequestSlice.actions;

export default adminRequestSlice.reducer;
