import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getStoredUserEmail } from "@/utils/auth-storage";
import { clearCsrfToken, fetchCsrfToken } from "@/utils/csrf";
import { withE164PhoneNumber } from "@/lib/phone-e164";

export interface InvitedUserData {
  estateId?: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Prefer WhatsApp-capable number in E.164 (e.g. +2348141153727). */
  phoneNumber?: string;
  /** Dial code used with the national number, e.g. +234. */
  countryCode?: string;
  role: string;
  /** Set to "owner" | "tenant" for residents; null for staff, security, admin, etc. */
  residentType: string | null;
  addressIds: string[];
  /** Required when inviting staff. */
  designationId?: string;
  /** Required when inviting a company or estate. */
  plan?: string;
  /** Optional modules granted when inviting staff. */
  modules?: string[];
}

interface VerifyInvitedUserData {
  email: string;
  tempPassword: string;
  newPassword: string;
}

// sign in
export const signIn = createAsyncThunk(
  "auth-mgt/signIn",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/auth-mgt/sign-in", data);
      const accessToken = res.data?.accessToken as string | undefined;
      if (accessToken) {
        await fetchCsrfToken(accessToken);
      }
      return res.data;
    } catch (error: any) {
      const apiError = error.response?.data;
      return rejectWithValue(apiError ?? error.message);
    }
  },
);

// verify otp
export const verifyOtp = createAsyncThunk(
  "auth-mgt/verifyOtp",
  async (data: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/auth-mgt/verify-otp", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.res?.data?.message);
    }
  },
);

// resend otp
export const resendOtp = createAsyncThunk(
  "auth-mgt/resendOtp",
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/auth-mgt/resend-otp", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.res?.data?.message);
    }
  },
);

// get signed in user
export const getSignedInUser = createAsyncThunk(
  "auth-mgt/getSignedInUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/v1/auth-mgt/me");
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      const message =
        typeof data === "string"
          ? data
          : (error as { message?: string })?.message;
      return rejectWithValue(
        message ? { message } : { message: "Failed to fetch user" },
      );
    }
  },
);

export type Membership = {
  /** Present on estate/company list items from `/me/memberships`. */
  id?: string | null;
  name?: string | null;
  estateId?: string | { id?: string; _id?: string; name?: string } | null;
  companyId?: string | { id?: string; _id?: string; name?: string } | null;
  estateName?: string | null;
  companyName?: string | null;
  role?: string | null;
  residentType?: string | null;
  addressIds?: string[];
  isActive?: boolean;
  /** Which membership is the user's current context. */
  isCurrent?: boolean;
};

export type SwitchMembershipPayload = {
  estateId?: string | null;
  companyId?: string | null;
};

/** List estates and companies the signed-in user belongs to. */
export const getMemberships = createAsyncThunk(
  "auth-mgt/getMemberships",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/api/v1/auth-mgt/me/memberships");
      return res.data;
    } catch (error: any) {
      const apiError = error.response?.data;
      return rejectWithValue(
        apiError?.message ?? apiError ?? error.message ?? "Failed to load memberships",
      );
    }
  },
);

/** Switch active estate/company membership and receive a new scoped access token. */
export const switchMembership = createAsyncThunk(
  "auth-mgt/switchMembership",
  async (data: SwitchMembershipPayload, { rejectWithValue }) => {
    try {
      const body: Record<string, string> = {};
      if (data.estateId) body.estateId = data.estateId;
      if (data.companyId) body.companyId = data.companyId;

      const res = await axiosInstance.post(
        "/api/v1/auth-mgt/me/switch-membership",
        body,
      );
      const accessToken = res.data?.accessToken as string | undefined;
      if (accessToken) {
        await fetchCsrfToken(accessToken);
      }
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

// reset password
export const resetPassword = createAsyncThunk(
  "auth-mgt/resetPassword",
  async (
    data: { email: string; resetToken: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/auth-mgt/reset-password",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.res?.data?.message);
    }
  },
);

// forgot pasword
export const forgotPassword = createAsyncThunk(
  "auth-mgt/forgotPassword",
  async (data: { email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/auth-mgt/forgot-password",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.res?.data?.message);
    }
  },
);

// sign out — revokes tokens and clears refresh cookie (user from Bearer, cookie, or body email)
export const signOut = createAsyncThunk(
  "auth-mgt/signOut",
  async (data: { email?: string } | undefined, { rejectWithValue }) => {
    try {
      const email = data?.email?.trim() || getStoredUserEmail();
      const body = email ? { email } : {};
      const res = await axiosInstance.post("/api/v1/auth-mgt/sign-out", body, {
        withCredentials: true,
      });
      clearCsrfToken();
      return res.data;
    } catch (error: any) {
      const apiError = error.response?.data;
      return rejectWithValue(
        apiError?.message ?? apiError ?? error.message ?? "Sign out failed",
      );
    }
  },
);

// Invite user (POST /api/v1/auth-mgt/invite-user)
export const iniviteUser = createAsyncThunk(
  "auth-mgt/inviteUser",
  async (data: InvitedUserData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/auth-mgt/invite-user",
        withE164PhoneNumber(data),
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);

// Invite user
export const verifyInivitedUser = createAsyncThunk(
  "auth-mgt/verifyInivitedUser",
  async (data: VerifyInvitedUserData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/api/v1/auth-mgt/verify-invited-user",
        data,
      );
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  },
);
