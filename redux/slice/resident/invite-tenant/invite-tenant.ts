import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import { toInviteUserApiBody } from "@/lib/phone-e164";

/**
 * Payload for resident (owner) inviting a tenant.
 * POST /api/v1/auth-mgt/invite-user
 * Resident type owner can only invite residentType: "tenant".
 */
export interface InviteTenantPayload {
  estateId: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  addressIds: string[];
}

export interface InviteTenantResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

export const inviteTenant = createAsyncThunk(
  "resident-invite-tenant/inviteTenant",
  async (payload: InviteTenantPayload, { rejectWithValue }) => {
    try {
      const { companyId, ...rest } = toInviteUserApiBody(payload);
      const trimmedCompanyId = companyId?.trim();
      const body = {
        ...rest,
        ...(trimmedCompanyId ? { companyId: trimmedCompanyId } : {}),
        role: "resident",
        residentType: "tenant",
      };
      const res = await axiosInstance.post<InviteTenantResponse>(
        "/api/v1/auth-mgt/invite-user",
        body
      );
      return res.data;
    } catch (error: unknown) {
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (data && typeof data === "object") return rejectWithValue(data);
      return rejectWithValue({
        message: getApiErrorMessage(error) || "Failed to invite tenant.",
      });
    }
  }
);
