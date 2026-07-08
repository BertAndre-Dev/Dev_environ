import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

interface EntryData {
  estateId: string | { id?: string; _id?: string };
  fieldId: string;
  data: Record<string, unknown>;
}

function normalizeEstateId(
  estateId: string | { id?: string; _id?: string } | undefined,
): string {
  if (typeof estateId === "string") return estateId;
  return estateId?._id || estateId?.id || "";
}

export const createEnergyProviderEntry = createAsyncThunk(
  "energy-provider-entry/createEntry",
  async (data: EntryData, { rejectWithValue }) => {
    try {
      const payload = {
        ...data,
        estateId: normalizeEstateId(data.estateId),
      };
      const res = await axiosInstance.post(
        "/api/v1/address-mgt/entry",
        payload,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create address entry",
      });
    }
  },
);

export const updateEnergyProviderEntry = createAsyncThunk(
  "energy-provider-entry/updateEntry",
  async (
    { entryId, data }: { entryId: string; data: EntryData },
    { rejectWithValue },
  ) => {
    try {
      const payload = {
        ...data,
        estateId: normalizeEstateId(data.estateId),
      };
      const res = await axiosInstance.put(
        `/api/v1/address-mgt/entry/${entryId}`,
        payload,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update address entry",
      });
    }
  },
);

export const deleteEnergyProviderEntry = createAsyncThunk(
  "energy-provider-entry/deleteEntry",
  async (entryId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/api/v1/address-mgt/entry/${entryId}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete address entry",
      });
    }
  },
);

export const getEnergyProviderEntry = createAsyncThunk(
  "energy-provider-entry/getEntry",
  async (entryId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/entry/${entryId}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch address entry",
      });
    }
  },
);

export const getEnergyProviderEntriesByField = createAsyncThunk(
  "energy-provider-entry/getEntriesByField",
  async (
    {
      fieldId,
      page,
      limit,
      startDate,
      endDate,
    }: {
      fieldId: string;
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      params.set("fieldId", fieldId);
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/field-entries?${params.toString()}`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch field entries",
      });
    }
  },
);

export const getEnergyProviderEntryStats = createAsyncThunk(
  "energy-provider-entry/getEntryStats",
  async (fieldId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/address-mgt/entry/${fieldId}/stats/`,
      );
      return res.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch entry stats",
      });
    }
  },
);
