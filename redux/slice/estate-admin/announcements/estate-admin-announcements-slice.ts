import { createSlice } from "@reduxjs/toolkit";
import {
  getEstateAdminAnnouncements,
  getEstateAdminAnnouncementById,
  type EstateAdminAnnouncementItem,
} from "./estate-admin-announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface EstateAdminAnnouncementsState {
  list: EstateAdminAnnouncementItem[] | null;
  current: EstateAdminAnnouncementItem | null;
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: EstateAdminAnnouncementsState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

const estateAdminAnnouncementsSlice = createSlice({
  name: "estateAdminAnnouncements",
  initialState,
  reducers: {
    clearCurrentEstateAdminAnnouncement: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEstateAdminAnnouncements.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminAnnouncements.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        const data = action.payload?.data;
        state.list = data?.items ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getEstateAdminAnnouncements.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(getEstateAdminAnnouncementById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getEstateAdminAnnouncementById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getEstateAdminAnnouncementById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcement";
      });
  },
});

export const { clearCurrentEstateAdminAnnouncement } =
  estateAdminAnnouncementsSlice.actions;
export default estateAdminAnnouncementsSlice.reducer;
