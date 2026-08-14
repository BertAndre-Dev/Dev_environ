import {
  createAsyncThunk,
  createSlice,
  type ActionReducerMapBuilder,
} from "@reduxjs/toolkit";
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

function asTrimmedString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/** Canonical key so "Service Charge" / "service-charge" match "service_charge". */
export function canonicalizeRevenueType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

function extractListFromPayload(raw: unknown, nestedKeys: string[]): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const root = raw as Record<string, unknown>;
  const candidates: unknown[] = [root, root.data];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (!candidate || typeof candidate !== "object") continue;
    const obj = candidate as Record<string, unknown>;
    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }

  return [];
}

export function normalizeRevenueTypes(raw: unknown): RevenueWithdrawalTypeItem[] {
  const list = extractListFromPayload(raw, [
    "revenueWithdrawalTypes",
    "types",
    "items",
  ]);

  return list
    .map((item): RevenueWithdrawalTypeItem | null => {
      if (typeof item === "string" && item.trim()) {
        const value = canonicalizeRevenueType(item);
        return { value, label: formatRevenueTypeLabel(value) };
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const rawValue =
          asTrimmedString(obj.value) ||
          asTrimmedString(obj.type) ||
          asTrimmedString(obj.revenueType) ||
          asTrimmedString(obj.code) ||
          asTrimmedString(obj.name);
        if (!rawValue) return null;
        const value = canonicalizeRevenueType(rawValue);
        const label =
          asTrimmedString(obj.label) ||
          asTrimmedString(obj.displayName) ||
          formatRevenueTypeLabel(value);
        return { value, label };
      }
      return null;
    })
    .filter((item): item is RevenueWithdrawalTypeItem => Boolean(item));
}

export function normalizeRevenueAccounts(
  raw: unknown,
): RevenueWithdrawalAccount[] {
  const list = extractListFromPayload(raw, [
    "revenueWithdrawalAccounts",
    "accounts",
    "items",
  ]);

  return list
    .map((item): RevenueWithdrawalAccount | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const revenueType = canonicalizeRevenueType(
        asTrimmedString(obj.revenueType) || asTrimmedString(obj.type),
      );
      const bankCode =
        asTrimmedString(obj.bankCode) || asTrimmedString(obj.bank_code);
      const accountNumber =
        asTrimmedString(obj.accountNumber) ||
        asTrimmedString(obj.account_number);
      const accountName =
        asTrimmedString(obj.accountName) || asTrimmedString(obj.account_name);
      if (!revenueType || !accountNumber) return null;

      const bankName =
        asTrimmedString(obj.bankName) ||
        asTrimmedString(obj.bank_name) ||
        undefined;

      return {
        id: asTrimmedString(obj.id) || undefined,
        _id: asTrimmedString(obj._id) || undefined,
        revenueType,
        bankCode,
        accountNumber,
        accountName,
        bankName,
        createdAt:
          asTrimmedString(obj.createdAt) ||
          asTrimmedString(obj.setAt) ||
          undefined,
        updatedAt: asTrimmedString(obj.updatedAt) || undefined,
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
export function createRevenueWithdrawalModule(
  role: RevenueWithdrawalRole,
  options?: {
    extraReducers?: (
      builder: ActionReducerMapBuilder<RevenueWithdrawalAccountState>,
    ) => void;
  },
) {
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

      options?.extraReducers?.(builder);
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
