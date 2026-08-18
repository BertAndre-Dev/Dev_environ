import { createSlice } from "@reduxjs/toolkit";
import {
  getAdminRequestWorkflow,
  upsertAdminRequestWorkflow,
  deleteAdminRequestWorkflow,
  type RequestWorkflow,
} from "./admin-request";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface AdminRequestState {
  workflows: RequestWorkflow[];
  getWorkflowStatus: AsyncStatus;
  upsertWorkflowStatus: AsyncStatus;
  deleteWorkflowStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminRequestState = {
  workflows: [],
  getWorkflowStatus: "idle",
  upsertWorkflowStatus: "idle",
  deleteWorkflowStatus: "idle",
  error: null,
};

function mergeWorkflow(
  list: RequestWorkflow[],
  saved: RequestWorkflow,
): RequestWorkflow[] {
  const savedName = saved.name.trim().toLowerCase();
  const savedId = (saved.id ?? saved._id ?? "").trim();
  const index = list.findIndex((item) => {
    const id = (item.id ?? item._id ?? "").trim();
    if (savedId && id && savedId === id) return true;
    return item.name.trim().toLowerCase() === savedName;
  });
  if (index < 0) return [...list, saved];
  return list.map((item, i) => (i === index ? { ...item, ...saved } : item));
}

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
      state.workflows = [];
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
        state.workflows = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getAdminRequestWorkflow.rejected, (state, action) => {
        state.getWorkflowStatus = "failed";
        state.workflows = [];
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
          state.workflows = mergeWorkflow(state.workflows, action.payload);
        }
      })
      .addCase(upsertAdminRequestWorkflow.rejected, (state, action) => {
        state.upsertWorkflowStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to save request workflow";
      })
      .addCase(deleteAdminRequestWorkflow.pending, (state) => {
        state.deleteWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAdminRequestWorkflow.fulfilled, (state, action) => {
        state.deleteWorkflowStatus = "succeeded";
        const deletedId = action.payload.id;
        state.workflows = state.workflows.filter(
          (workflow) => (workflow.id ?? workflow._id ?? "").trim() !== deletedId,
        );
      })
      .addCase(deleteAdminRequestWorkflow.rejected, (state, action) => {
        state.deleteWorkflowStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to delete request workflow";
      });
  },
});

export const {
  clearAdminRequestError,
  resetAdminRequestUpsertStatus,
  clearAdminRequestWorkflow,
} = adminRequestSlice.actions;

export default adminRequestSlice.reducer;
