import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export type RevenueWithdrawalRole =
  | "company"
  | "estateAdmin"
  | "energyProvider";

export interface SetRevenueWithdrawalAccountPayload {
  revenueType: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface RevenueWithdrawalAccount {
  id?: string;
  _id?: string;
  revenueType: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bankName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RevenueWithdrawalTypeItem {
  value: string;
  label: string;
}

type LoadState = "idle" | "isLoading" | "succeeded" | "failed";

export interface RevenueWithdrawalAccountState {
  accounts: RevenueWithdrawalAccount[];
  types: RevenueWithdrawalTypeItem[];
  autoSettlementEnabled: boolean | null;
  getAccountsState: LoadState;
  getTypesState: LoadState;
  setAccountState: LoadState;
  setAutoSettlementState: LoadState;
  error: string | null;
}

const FALLBACK_TYPES: RevenueWithdrawalTypeItem[] = [
  { value: "service_charge", label: "Service Charge" },
  { value: "vending", label: "Vending" },
  { value: "bills", label: "Bills" },
  { value: "other", label: "Other" },
  { value: "default", label: "Default" },
];

function getApiErrorMessage(error: unknown): string | undefined {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg) && msg[0]) return msg[0];
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return undefined;
}

function rejectMessage(action: {
  payload?: unknown;
  error?: { message?: string };
}): string | null {
  const payload = action.payload as { message?: string } | undefined;
  return payload?.message || action.error?.message || null;
}

function formatRevenueTypeLabel(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeRevenueTypes(raw: unknown): RevenueWithdrawalTypeItem[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) list = data;
  }

  return list
    .map((item): RevenueWithdrawalTypeItem | null => {
      if (typeof item === "string" && item.trim()) {
        return { value: item.trim(), label: formatRevenueTypeLabel(item.trim()) };
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const value =
          (typeof obj.value === "string" && obj.value) ||
          (typeof obj.type === "string" && obj.type) ||
          (typeof obj.revenueType === "string" && obj.revenueType) ||
          (typeof obj.name === "string" && obj.name) ||
          "";
        if (!value.trim()) return null;
        const label =
          (typeof obj.label === "string" && obj.label) ||
          (typeof obj.displayName === "string" && obj.displayName) ||
          formatRevenueTypeLabel(value.trim());
        return { value: value.trim(), label };
      }
      return null;
    })
    .filter((item): item is RevenueWithdrawalTypeItem => Boolean(item));
}

export function normalizeRevenueAccounts(
  raw: unknown,
): RevenueWithdrawalAccount[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const data = (raw as { data?: unknown }).data;
    if (Array.isArray(data)) list = data;
  }

  return list
    .map((item): RevenueWithdrawalAccount | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const revenueType =
        (typeof obj.revenueType === "string" && obj.revenueType) ||
        (typeof obj.type === "string" && obj.type) ||
        "";
      const bankCode =
        (typeof obj.bankCode === "string" && obj.bankCode) ||
        (typeof obj.bank_code === "string" && obj.bank_code) ||
        "";
      const accountNumber =
        (typeof obj.accountNumber === "string" && obj.accountNumber) ||
        (typeof obj.account_number === "string" && obj.account_number) ||
        "";
      const accountName =
        (typeof obj.accountName === "string" && obj.accountName) ||
        (typeof obj.account_name === "string" && obj.account_name) ||
        "";
      if (!revenueType || !accountNumber) return null;

      let bankName: string | undefined;
      if (typeof obj.bankName === "string") bankName = obj.bankName;
      else if (typeof obj.bank_name === "string") bankName = obj.bank_name;

      return {
        id: typeof obj.id === "string" ? obj.id : undefined,
        _id: typeof obj._id === "string" ? obj._id : undefined,
        revenueType,
        bankCode,
        accountNumber,
        accountName,
        bankName,
        createdAt:
          typeof obj.createdAt === "string" ? obj.createdAt : undefined,
        updatedAt:
          typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
      };
    })
    .filter((item): item is RevenueWithdrawalAccount => Boolean(item));
}

export function extractAutoSettlementEnabled(raw: unknown): boolean | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const data =
    obj.data && typeof obj.data === "object"
      ? (obj.data as Record<string, unknown>)
      : obj;

  const candidates = [
    data.autoSettlement,
    data.autoSettlementEnabled,
    data.enabled,
    data.isAutoSettlementEnabled,
    obj.autoSettlement,
    obj.autoSettlementEnabled,
    obj.enabled,
  ];

  for (const value of candidates) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

const initialState: RevenueWithdrawalAccountState = {
  accounts: [],
  types: [],
  autoSettlementEnabled: null,
  getAccountsState: "idle",
  getTypesState: "idle",
  setAccountState: "idle",
  setAutoSettlementState: "idle",
  error: null,
};

/**
 * Builds an isolated Redux module (unique action types + slice) per role.
 * Company / estate admin / energy provider each get their own store key.
 */
export function createRevenueWithdrawalModule(role: RevenueWithdrawalRole) {
  const prefix = `${role}/wallet-mgt`;

  const setRevenueWithdrawalAccount = createAsyncThunk(
    `${prefix}/setRevenueWithdrawalAccount`,
    async (data: SetRevenueWithdrawalAccountPayload, { rejectWithValue }) => {
      try {
        const res = await axiosInstance.post(
          "/api/v1/wallet-mgt/revenue-withdrawal-account",
          {
            revenueType: data.revenueType.trim(),
            bankCode: data.bankCode.trim(),
            accountNumber: data.accountNumber.trim(),
            accountName: data.accountName.trim(),
          },
        );
        return res.data;
      } catch (error: unknown) {
        return rejectWithValue({
          message: getApiErrorMessage(error),
        });
      }
    },
  );

  const getRevenueWithdrawalAccounts = createAsyncThunk(
    `${prefix}/getRevenueWithdrawalAccounts`,
    async (_, { rejectWithValue }) => {
      try {
        const res = await axiosInstance.get(
          "/api/v1/wallet-mgt/revenue-withdrawal-accounts",
        );
        return {
          accounts: normalizeRevenueAccounts(res.data),
          autoSettlementEnabled: extractAutoSettlementEnabled(res.data),
          raw: res.data,
        };
      } catch (error: unknown) {
        return rejectWithValue({
          message: getApiErrorMessage(error),
        });
      }
    },
  );

  const getRevenueWithdrawalTypes = createAsyncThunk(
    `${prefix}/getRevenueWithdrawalTypes`,
    async (_, { rejectWithValue }) => {
      try {
        const res = await axiosInstance.get(
          "/api/v1/wallet-mgt/revenue-withdrawal-types",
        );
        return {
          types: normalizeRevenueTypes(res.data),
          raw: res.data,
        };
      } catch (error: unknown) {
        return rejectWithValue({
          message: getApiErrorMessage(error),
        });
      }
    },
  );

  const setAutoSettlement = createAsyncThunk(
    `${prefix}/setAutoSettlement`,
    async (enabled: boolean, { rejectWithValue }) => {
      try {
        const res = await axiosInstance.post(
          "/api/v1/wallet-mgt/auto-settlement",
          { enabled },
        );
        return {
          enabled,
          autoSettlementEnabled:
            extractAutoSettlementEnabled(res.data) ?? enabled,
          raw: res.data,
        };
      } catch (error: unknown) {
        return rejectWithValue({
          message: getApiErrorMessage(error),
        });
      }
    },
  );

  const slice = createSlice({
    name: `${role}RevenueWithdrawalAccount`,
    initialState,
    reducers: {
      clearRevenueWithdrawalError: (state) => {
        state.error = null;
      },
      resetSetRevenueWithdrawalAccountState: (state) => {
        state.setAccountState = "idle";
        state.error = null;
      },
      resetRevenueWithdrawalAccountState: () => initialState,
    },
    extraReducers(builder) {
      builder
        .addCase(getRevenueWithdrawalAccounts.pending, (state) => {
          state.getAccountsState = "isLoading";
          state.error = null;
        })
        .addCase(getRevenueWithdrawalAccounts.fulfilled, (state, action) => {
          state.getAccountsState = "succeeded";
          state.accounts = action.payload.accounts;
          if (action.payload.autoSettlementEnabled !== null) {
            state.autoSettlementEnabled = action.payload.autoSettlementEnabled;
          }
          state.error = null;
        })
        .addCase(getRevenueWithdrawalAccounts.rejected, (state, action) => {
          state.getAccountsState = "failed";
          state.error = rejectMessage(action);
        })

        .addCase(getRevenueWithdrawalTypes.pending, (state) => {
          state.getTypesState = "isLoading";
        })
        .addCase(getRevenueWithdrawalTypes.fulfilled, (state, action) => {
          state.getTypesState = "succeeded";
          state.types =
            action.payload.types.length > 0
              ? action.payload.types
              : FALLBACK_TYPES;
        })
        .addCase(getRevenueWithdrawalTypes.rejected, (state, action) => {
          state.getTypesState = "failed";
          if (state.types.length === 0) {
            state.types = FALLBACK_TYPES;
          }
          state.error = rejectMessage(action) ?? state.error;
        })

        .addCase(setRevenueWithdrawalAccount.pending, (state) => {
          state.setAccountState = "isLoading";
          state.error = null;
        })
        .addCase(setRevenueWithdrawalAccount.fulfilled, (state) => {
          state.setAccountState = "succeeded";
          state.error = null;
        })
        .addCase(setRevenueWithdrawalAccount.rejected, (state, action) => {
          state.setAccountState = "failed";
          state.error = rejectMessage(action);
        })

        .addCase(setAutoSettlement.pending, (state) => {
          state.setAutoSettlementState = "isLoading";
          state.error = null;
        })
        .addCase(setAutoSettlement.fulfilled, (state, action) => {
          state.setAutoSettlementState = "succeeded";
          state.autoSettlementEnabled = action.payload.autoSettlementEnabled;
          state.error = null;
        })
        .addCase(setAutoSettlement.rejected, (state, action) => {
          state.setAutoSettlementState = "failed";
          state.error = rejectMessage(action);
        });
    },
  });

  return {
    setRevenueWithdrawalAccount,
    getRevenueWithdrawalAccounts,
    getRevenueWithdrawalTypes,
    setAutoSettlement,
    ...slice.actions,
    reducer: slice.reducer,
  };
}
