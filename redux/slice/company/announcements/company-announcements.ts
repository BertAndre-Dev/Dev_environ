import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export interface CompanyAnnouncementItem {
  id?: string;
  estateId?: string;
  title?: string;
  content?: string;
  description?: string;
  status?: string;
  scheduledFor?: string;
  sentAt?: string | null;
  viewCount?: number;
  viewedBy?: string[];
  emailSent?: boolean;
  emailsSent?: number;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: string;
  imageUrl?: string;
  file?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface CompanyAnnouncementsListResponse {
  success?: boolean;
  data?: {
    items: CompanyAnnouncementItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
  message?: string;
}

/** GET /api/v1/estates/announcements — read-only list for company (filter by estate) */
export const getCompanyAnnouncements = createAsyncThunk(
  "company-announcements/getList",
  async (
    params: { estateId: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const { estateId, page = 1, limit = 20 } = params;
      const res = await axiosInstance.get<CompanyAnnouncementsListResponse>(
        "/api/v1/estates/announcements",
        { params: { estateId, page, limit } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch announcements",
      });
    }
  },
);

/** GET /api/v1/estates/announcements/:id */
export const getCompanyAnnouncementById = createAsyncThunk(
  "company-announcements/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/api/v1/estates/announcements/${id}`);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch announcement",
      });
    }
  },
);
