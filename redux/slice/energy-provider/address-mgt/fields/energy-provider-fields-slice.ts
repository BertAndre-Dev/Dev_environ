import { createSlice } from "@reduxjs/toolkit";
import {
  createEnergyProviderField,
  deleteEnergyProviderField,
  getEnergyProviderField,
  getEnergyProviderFieldByEstate,
  updateEnergyProviderField,
} from "./energy-provider-fields";

interface FieldData {
  estateId: string;
  label: string;
  key: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
}

export interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface AllFieldResponse {
  success: boolean;
  message: string;
  data: FieldData[];
  pagination: Pagination;
}

export interface EnergyProviderFieldState {
  createFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  deleteFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  getFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  getFieldByEstateState: "idle" | "isLoading" | "succeeded" | "failed";
  updateFieldState: "idle" | "isLoading" | "succeeded" | "failed";
  status: "idle" | "isLoading" | "succeeded" | "failed";
  field: FieldData | null;
  allField: AllFieldResponse | null;
  error: string | null;
}

const initialState: EnergyProviderFieldState = {
  createFieldState: "idle",
  deleteFieldState: "idle",
  getFieldState: "idle",
  getFieldByEstateState: "idle",
  updateFieldState: "idle",
  status: "idle",
  field: null,
  allField: null,
  error: null,
};

const energyProviderFieldSlice = createSlice({
  name: "energyProviderField",
  initialState,
  reducers: {
    resetEnergyProviderFieldState: (state) => {
      state.status = "idle";
      state.error = null;
    },
    clearEnergyProviderFields: (state) => {
      state.allField = null;
      state.field = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getEnergyProviderFieldByEstate.pending, (state) => {
        state.getFieldByEstateState = "isLoading";
        state.status = "isLoading";
      })
      .addCase(getEnergyProviderFieldByEstate.fulfilled, (state, action) => {
        state.getFieldByEstateState = "succeeded";
        state.status = "succeeded";
        state.allField = {
          success: action.payload?.success ?? true,
          message:
            action.payload?.message ??
            "Address fields retrieved successfully.",
          data: action.payload?.data || [],
          pagination: action.payload?.pagination || {
            total: action.payload?.data?.length ?? 0,
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
          },
        };
      })
      .addCase(getEnergyProviderFieldByEstate.rejected, (state, action) => {
        state.getFieldByEstateState = "failed";
        state.status = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch estate fields";
      });

    builder
      .addCase(getEnergyProviderField.pending, (state) => {
        state.getFieldState = "isLoading";
      })
      .addCase(getEnergyProviderField.fulfilled, (state, action) => {
        state.getFieldState = "succeeded";
        state.field = action.payload?.data || null;
      })
      .addCase(getEnergyProviderField.rejected, (state, action) => {
        state.getFieldState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to fetch field";
      });

    builder
      .addCase(createEnergyProviderField.pending, (state) => {
        state.createFieldState = "isLoading";
      })
      .addCase(createEnergyProviderField.fulfilled, (state, action) => {
        state.createFieldState = "succeeded";
        const newField = action.payload?.data;
        if (newField) {
          if (state.allField?.data) {
            state.allField.data.push(newField);
            state.allField.pagination.total += 1;
          } else {
            state.allField = {
              success: true,
              message: "Field created successfully",
              data: [newField],
              pagination: {
                total: 1,
                currentPage: 1,
                totalPages: 1,
                pageSize: 10,
              },
            };
          }
        }
      })
      .addCase(createEnergyProviderField.rejected, (state, action) => {
        state.createFieldState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to create address field";
      });

    builder
      .addCase(updateEnergyProviderField.pending, (state) => {
        state.updateFieldState = "isLoading";
      })
      .addCase(updateEnergyProviderField.fulfilled, (state, action) => {
        state.updateFieldState = "succeeded";
        const updated = action.payload?.data;
        if (updated && state.allField?.data) {
          state.allField.data = state.allField.data.map((field) =>
            field.id === updated.id ? updated : field,
          );
        }
      })
      .addCase(updateEnergyProviderField.rejected, (state, action) => {
        state.updateFieldState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to update address field";
      });

    builder
      .addCase(deleteEnergyProviderField.pending, (state) => {
        state.deleteFieldState = "isLoading";
      })
      .addCase(deleteEnergyProviderField.fulfilled, (state, action) => {
        state.deleteFieldState = "succeeded";
        const deletedId = action.meta.arg;
        if (state.allField?.data) {
          state.allField.data = state.allField.data.filter(
            (field) => field.id !== deletedId,
          );
          state.allField.pagination.total -= 1;
        }
      })
      .addCase(deleteEnergyProviderField.rejected, (state, action) => {
        state.deleteFieldState = "failed";
        state.error =
          (action.payload as { message?: string })?.message ||
          action.error.message ||
          "Failed to delete address field";
      });
  },
});

export const { resetEnergyProviderFieldState, clearEnergyProviderFields } =
  energyProviderFieldSlice.actions;
export default energyProviderFieldSlice.reducer;
