import { createSlice } from "@reduxjs/toolkit";
import {
  getStaffRequestWorkflow,
  upsertStaffRequestWorkflow,
  deleteStaffRequestWorkflow,
  type RequestWorkflow,
} from "./staff-request-workflow";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface StaffRequestWorkflowState {
  workflows: RequestWorkflow[];
  getWorkflowStatus: AsyncStatus;
  upsertWorkflowStatus: AsyncStatus;
  deleteWorkflowStatus: AsyncStatus;
  error: string | null;
}

const initialState: StaffRequestWorkflowState = {
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

const staffRequestWorkflowSlice = createSlice({
  name: "staffRequestWorkflow",
  initialState,
  reducers: {
    clearStaffRequestWorkflowError: (state) => {
      state.error = null;
    },
    resetStaffRequestWorkflowUpsertStatus: (state) => {
      state.upsertWorkflowStatus = "idle";
    },
    clearStaffRequestWorkflow: (state) => {
      state.workflows = [];
      state.getWorkflowStatus = "idle";
      state.upsertWorkflowStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStaffRequestWorkflow.pending, (state) => {
        state.getWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(getStaffRequestWorkflow.fulfilled, (state, action) => {
        state.getWorkflowStatus = "succeeded";
        state.workflows = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getStaffRequestWorkflow.rejected, (state, action) => {
        state.getWorkflowStatus = "failed";
        state.workflows = [];
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch request workflow";
      })
      .addCase(upsertStaffRequestWorkflow.pending, (state) => {
        state.upsertWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(upsertStaffRequestWorkflow.fulfilled, (state, action) => {
        state.upsertWorkflowStatus = "succeeded";
        if (action.payload) {
          state.workflows = mergeWorkflow(state.workflows, action.payload);
        }
      })
      .addCase(upsertStaffRequestWorkflow.rejected, (state, action) => {
        state.upsertWorkflowStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to save request workflow";
      })
      .addCase(deleteStaffRequestWorkflow.pending, (state) => {
        state.deleteWorkflowStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteStaffRequestWorkflow.fulfilled, (state, action) => {
        state.deleteWorkflowStatus = "succeeded";
        const deletedId = action.payload.id;
        state.workflows = state.workflows.filter(
          (workflow) => (workflow.id ?? workflow._id ?? "").trim() !== deletedId,
        );
      })
      .addCase(deleteStaffRequestWorkflow.rejected, (state, action) => {
        state.deleteWorkflowStatus = "failed";
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to delete request workflow";
      });
  },
});

export const {
  clearStaffRequestWorkflowError,
  resetStaffRequestWorkflowUpsertStatus,
  clearStaffRequestWorkflow,
} = staffRequestWorkflowSlice.actions;

export default staffRequestWorkflowSlice.reducer;
