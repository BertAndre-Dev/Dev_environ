import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import {
  activateAssetMaintenance,
  addAssetMaintenanceComment,
  createAssetMaintenance,
  deleteAssetMaintenance,
  getAssetMaintenanceComments,
  getAssetMaintenanceList,
  suspendAssetMaintenance,
  updateAssetMaintenance,
  type ApiPagination,
  type AssetMaintenanceComment,
  type AssetMaintenanceRecord,
} from "./admin-asset-maintenance";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface AdminAssetMaintenanceState {
  records: AssetMaintenanceRecord[];
  pagination: ApiPagination | null;
  commentsByMaintenanceId: Record<string, AssetMaintenanceComment[]>;
  commentsPagination: ApiPagination | null;
  getListStatus: AsyncStatus;
  createStatus: AsyncStatus;
  updateStatus: AsyncStatus;
  deleteStatus: AsyncStatus;
  suspendStatus: AsyncStatus;
  activateStatus: AsyncStatus;
  getCommentsStatus: AsyncStatus;
  addCommentStatus: AsyncStatus;
  error: string | null;
}

const initialState: AdminAssetMaintenanceState = {
  records: [],
  pagination: null,
  commentsByMaintenanceId: {},
  commentsPagination: null,
  getListStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  suspendStatus: "idle",
  activateStatus: "idle",
  getCommentsStatus: "idle",
  addCommentStatus: "idle",
  error: null,
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

function mergeRecord(
  list: AssetMaintenanceRecord[],
  updated: AssetMaintenanceRecord | undefined,
  id: string,
) {
  if (!id) return list;
  const idx = list.findIndex((r) => getId(r) === id);
  if (idx === -1) return list;
  return list.map((r, i) => (i === idx ? { ...r, ...updated, id } : r));
}

function asComment(
  value: unknown,
  maintenanceId?: string,
): AssetMaintenanceComment | null {
  if (!value || typeof value !== "object") return null;
  const c = value as AssetMaintenanceComment;
  return {
    ...c,
    id: getId(c) || undefined,
    maintenanceId: c.maintenanceId ?? maintenanceId,
  };
}

const adminAssetMaintenanceSlice = createSlice({
  name: "adminAssetMaintenance",
  initialState,
  reducers: {
    clearAdminAssetMaintenanceError: (state) => {
      state.error = null;
    },
    clearAdminAssetMaintenanceComments: (state) => {
      state.commentsByMaintenanceId = {};
      state.commentsPagination = null;
      state.getCommentsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAssetMaintenanceList.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssetMaintenanceList.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        state.records = action.payload?.data ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(getAssetMaintenanceList.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.records = [];
        state.pagination = null;
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(createAssetMaintenance.pending, (state) => {
        state.createStatus = "isLoading";
        state.error = null;
      })
      .addCase(createAssetMaintenance.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.records = [created, ...state.records];
      })
      .addCase(createAssetMaintenance.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(updateAssetMaintenance.pending, (state) => {
        state.updateStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateAssetMaintenance.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const payload = action.payload as {
          data?: AssetMaintenanceRecord;
          maintenanceId?: string;
        };
        const id = payload.maintenanceId ?? "";
        state.records = mergeRecord(state.records, payload.data, id);
      })
      .addCase(updateAssetMaintenance.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(deleteAssetMaintenance.pending, (state) => {
        state.deleteStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteAssetMaintenance.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const id = (action.payload as { deletedId?: string })?.deletedId;
        if (id) {
          state.records = state.records.filter((r) => getId(r) !== id);
          delete state.commentsByMaintenanceId[id];
        }
      })
      .addCase(deleteAssetMaintenance.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(suspendAssetMaintenance.pending, (state) => {
        state.suspendStatus = "isLoading";
      })
      .addCase(suspendAssetMaintenance.fulfilled, (state, action) => {
        state.suspendStatus = "succeeded";
        const id = (action.payload as { maintenanceId?: string })?.maintenanceId;
        if (id) {
          state.records = state.records.map((r) =>
            getId(r) === id ? { ...r, isActive: false } : r,
          );
        }
      })
      .addCase(suspendAssetMaintenance.rejected, (state, action) => {
        state.suspendStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(activateAssetMaintenance.pending, (state) => {
        state.activateStatus = "isLoading";
      })
      .addCase(activateAssetMaintenance.fulfilled, (state, action) => {
        state.activateStatus = "succeeded";
        const id = (action.payload as { maintenanceId?: string })?.maintenanceId;
        if (id) {
          state.records = state.records.map((r) =>
            getId(r) === id ? { ...r, isActive: true } : r,
          );
        }
      })
      .addCase(activateAssetMaintenance.rejected, (state, action) => {
        state.activateStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(getAssetMaintenanceComments.pending, (state) => {
        state.getCommentsStatus = "isLoading";
        state.error = null;
      })
      .addCase(getAssetMaintenanceComments.fulfilled, (state, action) => {
        state.getCommentsStatus = "succeeded";
        const maintenanceId = action.payload?.maintenanceId ?? "";
        if (maintenanceId) {
          state.commentsByMaintenanceId[maintenanceId] =
            action.payload?.data ?? [];
        }
        state.commentsPagination = action.payload?.pagination ?? null;
      })
      .addCase(getAssetMaintenanceComments.rejected, (state, action) => {
        state.getCommentsStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      })
      .addCase(addAssetMaintenanceComment.pending, (state) => {
        state.addCommentStatus = "isLoading";
        state.error = null;
      })
      .addCase(addAssetMaintenanceComment.fulfilled, (state, action) => {
        state.addCommentStatus = "succeeded";
        const payload = action.payload as {
          data?: AssetMaintenanceComment | AssetMaintenanceComment[];
          maintenanceId?: string;
        };
        const maintenanceId = payload.maintenanceId ?? "";
        if (!maintenanceId) return;

        const created = Array.isArray(payload.data)
          ? payload.data[0]
          : payload.data;
        const comment = asComment(created, maintenanceId);
        if (!comment) return;

        const existing = state.commentsByMaintenanceId[maintenanceId] ?? [];
        state.commentsByMaintenanceId[maintenanceId] = [comment, ...existing];
      })
      .addCase(addAssetMaintenanceComment.rejected, (state, action) => {
        state.addCommentStatus = "failed";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ??
          action.error.message ??
          null;
      });
  },
});

export const {
  clearAdminAssetMaintenanceError,
  clearAdminAssetMaintenanceComments,
} = adminAssetMaintenanceSlice.actions;
export default adminAssetMaintenanceSlice.reducer;

export const selectAdminAssetMaintenance = (state: RootState) =>
  (state.adminAssetMaintenance as AdminAssetMaintenanceState | undefined) ??
  initialState;
