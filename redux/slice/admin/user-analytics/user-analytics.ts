import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiErrorRejectValue, type ApiErrorRejectValue } from "@/lib/api-error";
import { extractEstateId } from "@/lib/user-id";
import axiosInstance from "@/utils/axiosInstance";

export interface ResidentTypeStats {
  total: number;
  active: number;
  averageAddressCount: number;
}

export interface ResidentTypeBreakdownData {
  owner: ResidentTypeStats;
  tenant: ResidentTypeStats;
}

export interface ResidentTypeBreakdownResponse {
  success: boolean;
  message: string;
  data: ResidentTypeBreakdownData;
}

export interface UserSummaryData {
  _id: string | null;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export interface UserSummaryResponse {
  success: boolean;
  message: string;
  data: UserSummaryData;
}

export interface RoleStats {
  total: number;
  active: number;
}

/** API may return a bare number (e.g. `"super admin": 0`) or `{ total, active }`. */
export type RoleBreakdownEntry = number | RoleStats;

export type RoleBreakdownData = Record<string, RoleBreakdownEntry>;

export interface RoleBreakdownResponse {
  success: boolean;
  message: string;
  data: RoleBreakdownData;
}

export function normalizeRoleStats(entry: RoleBreakdownEntry | undefined): RoleStats {
  if (entry == null) return { total: 0, active: 0 };
  if (typeof entry === "number") {
    const n = Math.max(0, Number(entry) || 0);
    return { total: n, active: n };
  }
  return {
    total: Math.max(0, Number(entry.total ?? 0) || 0),
    active: Math.max(0, Number(entry.active ?? 0) || 0),
  };
}

export const getResidentTypeBreakdown = createAsyncThunk(
  "adminUserAnalytics/getResidentTypeBreakdown",
  async ({ estateId }: { estateId: string }, { rejectWithValue }) => {
    const id = extractEstateId(estateId);
    if (!id) {
      return rejectWithValue({ message: "Invalid estate ID." });
    }
    try {
      const res = await axiosInstance.get<ResidentTypeBreakdownResponse>(
        "/api/v1/user-analytics/resident-type-breakdown",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch resident type breakdown.",
      });
    }
  },
);

/** GET /api/v1/user-analytics/summary?estateId= */
export const getUserSummary = createAsyncThunk<
  UserSummaryResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>("adminUserAnalytics/getUserSummary", async ({ estateId }, { rejectWithValue }) => {
  const id = extractEstateId(estateId);
  if (!id) {
    return rejectWithValue({ message: "Invalid estate ID." });
  }
  try {
    const res = await axiosInstance.get<UserSummaryResponse>(
      "/api/v1/user-analytics/summary",
      { params: { estateId: id } },
    );
    return res.data;
  } catch (error: unknown) {
    return rejectWithValue(apiErrorRejectValue(error));
  }
});

/** GET /api/v1/user-analytics/role-breakdown?estateId= */
export const getUserRoleBreakdown = createAsyncThunk<
  RoleBreakdownResponse,
  { estateId: string },
  { rejectValue: ApiErrorRejectValue }
>(
  "adminUserAnalytics/getUserRoleBreakdown",
  async ({ estateId }, { rejectWithValue }) => {
    const id = extractEstateId(estateId);
    if (!id) {
      return rejectWithValue({ message: "Invalid estate ID." });
    }
    try {
      const res = await axiosInstance.get<RoleBreakdownResponse>(
        "/api/v1/user-analytics/role-breakdown",
        { params: { estateId: id } },
      );
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(apiErrorRejectValue(error));
    }
  },
);
