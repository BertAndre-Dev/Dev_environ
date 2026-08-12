import { createSlice } from "@reduxjs/toolkit";
import {
  createVisitor,
  getVisitorsByEstate,
  verifyVisitor,
  getVisitorDetailsByCode,
} from "./visitor";

export interface VisitorEntry {
  id: string;
  data: Record<string, any>;
}

export interface NestedVisitor {
  id: string;
  visitorCode: string;
  residentId: string;
  estateId: string;
  addressId: string;
  visitor: Array<{ id: string }>;
  isVerified: boolean;
  createdAt: string;
}

export interface VisitorWithEntries {
  visitor: NestedVisitor;
  entries: VisitorEntry[];
}

export interface VisitorsResponse {
  success: boolean;
  message: string;
  data: VisitorWithEntries[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VisitorState {
  createVisitorState: "idle" | "isLoading" | "succeeded" | "failed";
  getVisitorsByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  verifyVisitorState: "idle" | "isLoading" | "succeeded" | "failed";
  getVisitorDetailsByCodeState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  allVisitors: VisitorsResponse | null;
  verifyResult: { success: boolean; message: string } | null;
  error: string | null;
}

const initialState: VisitorState = {
  createVisitorState: "idle",
  getVisitorsByEstateState: "idle",
  verifyVisitorState: "idle",
  getVisitorDetailsByCodeState: "idle",
  status: "idle",
  allVisitors: null,
  verifyResult: null,
  error: null,
};

const visitorSlice = createSlice({
  name: "visitor",
  initialState,
  reducers: {
    resetVisitorState: (state) => {
      state.status = "idle";
      state.createVisitorState = "idle";
      state.getVisitorsByEstateState = "idle";
      state.verifyVisitorState = "idle";
      state.error = null;
      state.verifyResult = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(createVisitor.pending, (state) => {
        state.createVisitorState = "isLoading";
        state.status = "isLoading";
        state.error = null;
      })
      .addCase(createVisitor.fulfilled, (state) => {
        state.createVisitorState = "succeeded";
        state.status = "succeeded";
      })
      .addCase(createVisitor.rejected, (state, action) => {
        state.createVisitorState = "failed";
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to create visitor";
      });

    // GET VISITORS
    builder
      .addCase(getVisitorsByEstate.pending, (state) => {
        state.getVisitorsByEstateState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getVisitorsByEstate.fulfilled, (state, action) => {
        state.getVisitorsByEstateState = "succeeded";
        state.status = "succeeded";
        state.allVisitors = action.payload || null;
      })
      .addCase(getVisitorsByEstate.rejected, (state, action) => {
        state.getVisitorsByEstateState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch visitors";
      });


    builder
      .addCase(getVisitorDetailsByCode.pending, (state) => {
        state.getVisitorDetailsByCodeState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getVisitorDetailsByCode.fulfilled, (state, action) => {
        state.getVisitorDetailsByCodeState = "succeeded";
        state.status = "succeeded";
        state.allVisitors = action.payload || null;
      })
      .addCase(getVisitorDetailsByCode.rejected, (state, action) => {
        state.getVisitorDetailsByCodeState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch visitors";
      });

    // VERIFY VISITOR
    builder
      .addCase(verifyVisitor.pending, (state) => {
        state.verifyVisitorState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(verifyVisitor.fulfilled, (state, action) => {
        state.verifyVisitorState = "succeeded";
        state.status = "succeeded";
        state.verifyResult = action.payload;

        // update verified flag
        if (state.allVisitors?.data && action.payload?.visitorId) {
          state.allVisitors.data = state.allVisitors.data.map((v) =>
            v.visitor.id === action.payload.visitorId
              ? { ...v, visitor: { ...v.visitor, isVerified: true } }
              : v
          );
        }
      })
      .addCase(verifyVisitor.rejected, (state, action) => {
        state.verifyVisitorState = "failed";
        state.status = "failed";
        state.error = action.error.message || "Failed to verify visitor";
      });
  },
});

export const { resetVisitorState } = visitorSlice.actions;
export default visitorSlice.reducer;
