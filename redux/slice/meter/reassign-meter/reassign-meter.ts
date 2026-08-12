import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

/**
 * PUT /api/v1/meters/reassign-meter
 * Assign a meter to an estate (company users assign from company inventory).
 */
export interface ReassignMeterPayload {
  meterNumber: string;
  userId?: string;
  estateId?: string;
  companyId?: string;
  newEstateId?: string;
  addressId?: string;
  unassign?: boolean;
}

export interface ReassignMeterResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: string;
    meterNumber?: string;
    isActive?: boolean;
    isAssigned?: boolean;
    estateId?: string;
    companyId?: string;
    addressId?: string | { id: string };
    [key: string]: unknown;
  };
}

export const reassignMeter = createAsyncThunk(
  "reassign-meter/reassign",
  async (data: ReassignMeterPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put<ReassignMeterResponse>(
        "/api/v1/meters/reassign-meter",
        data,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to reassign meter.",
      });
    }
  },
);
