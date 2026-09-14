import { createSlice } from "@reduxjs/toolkit";
import {
  getCompanyAnnouncements,
  getCompanyAnnouncementById,
  type CompanyAnnouncementItem,
} from "./company-announcements";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyAnnouncementsState {
  list: CompanyAnnouncementItem[] | null;
  current: CompanyAnnouncementItem | null;
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  getListStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyAnnouncementsState = {
  list: null,
  current: null,
  pagination: null,
  getListStatus: "idle",
  getByIdStatus: "idle",
  error: null,
};

const companyAnnouncementsSlice = createSlice({
  name: "companyAnnouncements",
  initialState,
  reducers: {
    clearCurrentCompanyAnnouncement: (state) => {
      state.current = null;
      state.getByIdStatus = "idle";
    },
    resetCompanyAnnouncementsList: (state) => {
      state.list = null;
      state.pagination = null;
      state.getListStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyAnnouncements.pending, (state) => {
        state.getListStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyAnnouncements.fulfilled, (state, action) => {
        state.getListStatus = "succeeded";
        const data = action.payload?.data;
        state.list = data?.items ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getCompanyAnnouncements.rejected, (state, action) => {
        state.getListStatus = "failed";
        state.list = null;
        state.pagination = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcements";
      })
      .addCase(getCompanyAnnouncementById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getCompanyAnnouncementById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload?.data ?? null;
      })
      .addCase(getCompanyAnnouncementById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.current = null;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          "Failed to fetch announcement";
      });
  },
});

export const {
  clearCurrentCompanyAnnouncement,
  resetCompanyAnnouncementsList,
} = companyAnnouncementsSlice.actions;
export default companyAnnouncementsSlice.reducer;
