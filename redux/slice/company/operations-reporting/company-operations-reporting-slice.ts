import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { getApiErrorMessage } from "@/lib/api-error";

import {
  createCompanyOperationsReportingField,
  createCompanyOperationsReportingType,
  deleteCompanyOperationsReportingField,
  deleteCompanyOperationsReportingType,
  fetchCompanyOperationsReportingEntries,
  fetchCompanyOperationsReportingFields,
  fetchCompanyOperationsReportingTypes,
  updateCompanyOperationsReportingField,
  updateCompanyOperationsReportingType,
  type ApiPagination,
  type CompanyOperationsReportingEntry,
  type CompanyOperationsReportingField,
  type CompanyOperationsReportingType,
} from "./company-operations-reporting";

type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

export interface CompanyOperationsReportingState {
  estateId: string | null;
  types: CompanyOperationsReportingType[];
  fields: CompanyOperationsReportingField[];
  entries: CompanyOperationsReportingEntry[];
  typesPagination: ApiPagination | null;
  fieldsPagination: ApiPagination | null;
  entriesPagination: ApiPagination | null;
  getTypesStatus: AsyncStatus;
  createTypeStatus: AsyncStatus;
  updateTypeStatus: AsyncStatus;
  deleteTypeStatus: AsyncStatus;
  getFieldsStatus: AsyncStatus;
  createFieldStatus: AsyncStatus;
  updateFieldStatus: AsyncStatus;
  deleteFieldStatus: AsyncStatus;
  getEntriesStatus: AsyncStatus;
  error: string | null;
}

const initialState: CompanyOperationsReportingState = {
  estateId: null,
  types: [],
  fields: [],
  entries: [],
  typesPagination: null,
  fieldsPagination: null,
  entriesPagination: null,
  getTypesStatus: "idle",
  createTypeStatus: "idle",
  updateTypeStatus: "idle",
  deleteTypeStatus: "idle",
  getFieldsStatus: "idle",
  createFieldStatus: "idle",
  updateFieldStatus: "idle",
  deleteFieldStatus: "idle",
  getEntriesStatus: "idle",
  error: null,
};

function getId(v: { id?: string; _id?: string } | undefined) {
  return v?.id || v?._id || "";
}

const companyOperationsReportingSlice = createSlice({
  name: "companyOperationsReporting",
  initialState,
  reducers: {
    clearCompanyOperationsReportingError: (state) => {
      state.error = null;
    },
    setCompanyOperationsReportingEstate: (state, action: { payload: string }) => {
      state.estateId = action.payload;
      state.types = [];
      state.fields = [];
      state.entries = [];
      state.typesPagination = null;
      state.fieldsPagination = null;
      state.entriesPagination = null;
      state.getTypesStatus = "idle";
      state.createTypeStatus = "idle";
      state.updateTypeStatus = "idle";
      state.deleteTypeStatus = "idle";
      state.getFieldsStatus = "idle";
      state.createFieldStatus = "idle";
      state.updateFieldStatus = "idle";
      state.deleteFieldStatus = "idle";
      state.getEntriesStatus = "idle";
      state.error = null;
    },
    resetCompanyOperationsReportingFields: (state) => {
      state.fields = [];
      state.entries = [];
      state.fieldsPagination = null;
      state.entriesPagination = null;
      state.getFieldsStatus = "idle";
      state.getEntriesStatus = "idle";
    },
    resetCompanyOperationsReportingEntries: (state) => {
      state.entries = [];
      state.entriesPagination = null;
      state.getEntriesStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyOperationsReportingTypes.pending, (state) => {
        state.getTypesStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingTypes.fulfilled, (state, action) => {
        state.getTypesStatus = "succeeded";
        state.types = action.payload?.data ?? [];
        state.typesPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingTypes.rejected, (state, action) => {
        state.getTypesStatus = "failed";
        state.types = [];
        state.typesPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(createCompanyOperationsReportingType.pending, (state) => {
        state.createTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyOperationsReportingType.fulfilled, (state, action) => {
        state.createTypeStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.types = [created, ...state.types];
      })
      .addCase(createCompanyOperationsReportingType.rejected, (state, action) => {
        state.createTypeStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(updateCompanyOperationsReportingType.pending, (state) => {
        state.updateTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyOperationsReportingType.fulfilled, (state, action) => {
        state.updateTypeStatus = "succeeded";
        const typeId = (action.payload as { typeId?: string })?.typeId ?? "";
        const updated = (action.payload as { data?: CompanyOperationsReportingType })
          ?.data;
        if (typeId) {
          state.types = state.types.map((t) =>
            getId(t) === typeId ? { ...t, ...updated, id: typeId } : t,
          );
        }
      })
      .addCase(updateCompanyOperationsReportingType.rejected, (state, action) => {
        state.updateTypeStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(deleteCompanyOperationsReportingType.pending, (state) => {
        state.deleteTypeStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyOperationsReportingType.fulfilled, (state, action) => {
        state.deleteTypeStatus = "succeeded";
        const id = (action.payload as { deletedTypeId?: string })?.deletedTypeId;
        if (id) {
          state.types = state.types.filter((t) => getId(t) !== id);
        }
      })
      .addCase(deleteCompanyOperationsReportingType.rejected, (state, action) => {
        state.deleteTypeStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(fetchCompanyOperationsReportingFields.pending, (state) => {
        state.getFieldsStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingFields.fulfilled, (state, action) => {
        state.getFieldsStatus = "succeeded";
        state.fields = action.payload?.data ?? [];
        state.fieldsPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingFields.rejected, (state, action) => {
        state.getFieldsStatus = "failed";
        state.fields = [];
        state.fieldsPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(createCompanyOperationsReportingField.pending, (state) => {
        state.createFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(createCompanyOperationsReportingField.fulfilled, (state, action) => {
        state.createFieldStatus = "succeeded";
        const created = action.payload?.data;
        if (created) state.fields = [created, ...state.fields];
      })
      .addCase(createCompanyOperationsReportingField.rejected, (state, action) => {
        state.createFieldStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(updateCompanyOperationsReportingField.pending, (state) => {
        state.updateFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(updateCompanyOperationsReportingField.fulfilled, (state, action) => {
        state.updateFieldStatus = "succeeded";
        const fieldId = (action.payload as { fieldId?: string })?.fieldId ?? "";
        const updated = (action.payload as { data?: CompanyOperationsReportingField })
          ?.data;
        if (fieldId) {
          state.fields = state.fields.map((f) =>
            getId(f) === fieldId ? { ...f, ...updated, id: fieldId } : f,
          );
        }
      })
      .addCase(updateCompanyOperationsReportingField.rejected, (state, action) => {
        state.updateFieldStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      })
      .addCase(deleteCompanyOperationsReportingField.pending, (state) => {
        state.deleteFieldStatus = "isLoading";
        state.error = null;
      })
      .addCase(deleteCompanyOperationsReportingField.fulfilled, (state, action) => {
        state.deleteFieldStatus = "succeeded";
        const id = (action.payload as { deletedFieldId?: string })?.deletedFieldId;
        if (id) {
          state.fields = state.fields.filter((f) => getId(f) !== id);
        }
      })
      .addCase(deleteCompanyOperationsReportingField.rejected, (state, action) => {
        state.deleteFieldStatus = "failed";
        state.error = getApiErrorMessage(action.payload) ?? null;
      });

    builder
      .addCase(fetchCompanyOperationsReportingEntries.pending, (state) => {
        state.getEntriesStatus = "isLoading";
        state.error = null;
      })
      .addCase(fetchCompanyOperationsReportingEntries.fulfilled, (state, action) => {
        state.getEntriesStatus = "succeeded";
        state.entries = action.payload?.data ?? [];
        state.entriesPagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCompanyOperationsReportingEntries.rejected, (state, action) => {
        state.getEntriesStatus = "failed";
        state.entries = [];
        state.entriesPagination = null;
        state.error = getApiErrorMessage(action.payload) ?? null;
      });
  },
});

export const {
  clearCompanyOperationsReportingError,
  setCompanyOperationsReportingEstate,
  resetCompanyOperationsReportingFields,
  resetCompanyOperationsReportingEntries,
} = companyOperationsReportingSlice.actions;

export default companyOperationsReportingSlice.reducer;

export const selectCompanyOperationsReporting = (state: RootState) =>
  (state.companyOperationsReporting as CompanyOperationsReportingState | undefined) ??
  initialState;
