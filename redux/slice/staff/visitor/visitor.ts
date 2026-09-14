import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type VisitingType = "SHORT_VISIT" | "LONG_VISIT";

export interface CreateStaffVisitorData {
  firstName: string;
  lastName: string;
  phone: string;
  purpose: string;
  residentId: string | null;
  estateId: string;
  addressId: string | null;
  visitingType: VisitingType;
  visitStartDate: string | null;
  visitEndDate?: string | null;
}

interface VisitorData {
  visitorCode: string;
}

interface GetVisitorDetailsParams {
  code: string;
}

/** POST /api/v1/visitor-mgt — admin invite (bulk via visitors[]; addressId/residentId may be null) */
export const createVisitor = createAsyncThunk(
  "staff-visitor/createVisitor",
  async (
    data: CreateStaffVisitorData | CreateStaffVisitorData[],
    { rejectWithValue },
  ) => {
    try {
      const visitors = Array.isArray(data) ? data : [data];
      const res = await axiosInstance.post("/api/v1/visitor-mgt", {
        visitors,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create visitor" },
      );
    }
  },
);

export const verifyVisitor = createAsyncThunk(
  "staff-visitor/verifyVisitor",
  async (data: VisitorData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put("/api/v1/visitor-mgt/verify-code", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// Delete visitor (admin) — temporarily disabled
// export const deleteVisitor = createAsyncThunk(
//   "staff-visitor/deleteVisitor",
//   async (id: string, { rejectWithValue }) => {
//     try {
//       const res = await axiosInstance.delete(`/api/v1/visitor-mgt/${id}`);
//       return res.data;
//     } catch (error: any) {
//       return rejectWithValue(
//         error.response?.data || { message: "Failed to delete visitor" },
//       );
//     }
//   },
// );


export const getVisitorsByEstate = createAsyncThunk(
  "staff-visitor/getVisitorsByEstate",
  async (
    {
      estateId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    }: {
      estateId: string;
      page: number;
      limit: number;
      startDate?: string;
      endDate?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (page != null) params.set("page", String(page));
      if (limit != null) params.set("limit", String(limit));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const query = params.toString();
      const suffix = query ? "?" + query : "";
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/all-visitors/${estateId}` + suffix
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);


export const getVisitorDetailsByCode = createAsyncThunk(
  "staff-visitor/getVisitorDetailsByCode",
  async ({ code }: GetVisitorDetailsParams, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/api/v1/visitor-mgt/view-details`,
        {
          params: { code },
        }
      );

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);
