import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface FieldData {
  estateId: string;
  label: string;
  key: string;
}

function normalizeEstateId(
  estateId: string | { id?: string; _id?: string },
): string {
  if (typeof estateId === "string") return estateId;
  return estateId?._id || estateId?.id || "";
}

export const createEnergyProviderField = createAsyncThunk(
  "energy-provider-field/createField",
  async (data: FieldData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/api/v1/address-mgt/field", data);
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create address field",
      });
    }
  },
);

export const getEnergyProviderField = createAsyncThunk(
  "energy-provider-field/getField",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/field/${fieldId}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch address field",
      });
    }
  },
);

export const getEnergyProviderFieldByEstate = createAsyncThunk(
  "energy-provider-field/getFieldByEstate",
  async (
    estateId: string | { id?: string; _id?: string },
    { rejectWithValue },
  ) => {
    try {
      const normalizedEstateId = normalizeEstateId(estateId);
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/estate/${normalizedEstateId}/fields`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch estate fields",
      });
    }
  },
);

export const updateEnergyProviderField = createAsyncThunk(
  "energy-provider-field/updateField",
  async (
    { fieldId, data }: { fieldId: string; data: FieldData },
    { rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/address-mgt/field/${fieldId}`,
        data,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update address field",
      });
    }
  },
);

export const deleteEnergyProviderField = createAsyncThunk(
  "energy-provider-field/deleteField",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/address-mgt/field/${fieldId}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete address field",
      });
    }
  },
);
