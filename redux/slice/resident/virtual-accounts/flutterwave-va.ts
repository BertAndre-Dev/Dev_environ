import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

const BASE = "/api/v1/payment-mgt/virtual-accounts/flutterwave";

/**
 * Shape returned by GET/POST
 * `/api/v1/payment-mgt/virtual-accounts/flutterwave`
 * Account display name is not a dedicated field — it lives in `note`
 * (e.g. "Please make a bank transfer to Bertandre Consulting/JOHN DOE").
 */
export interface FlutterwaveVirtualAccount {
  id: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankCode: string | null;
  /** Derived from `note` or an explicit accountName field if present. */
  accountName: string | null;
  currency: string | null;
  txRef: string | null;
  orderRef: string | null;
  note: string | null;
  status: string | null;
  isPermanent: boolean;
  identityHint: string | null;
  serviceFee: number | null;
  createdAt: string | null;
  raw: Record<string, unknown> | null;
}

export interface CreateFlutterwaveVaPayload {
  phonenumber: string;
  nin: string;
}

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(
  obj: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!obj) return null;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number" && Number.isFinite(val)) return String(val);
  }
  return null;
}

function pickNumber(
  obj: Record<string, unknown> | null,
  keys: string[],
): number | null {
  if (!obj) return null;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim()) {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data);
  return nested ?? root;
}

/** "Please make a bank transfer to Bertandre Consulting/JOHN DOE" → beneficiary. */
export function accountNameFromNote(note: string | null): string | null {
  if (!note) return null;
  const match = note.match(/transfer\s+to\s+(.+)$/i);
  const beneficiary = (match?.[1] ?? note).trim();
  return beneficiary || null;
}

export function normalizeVirtualAccount(
  payload: unknown,
): FlutterwaveVirtualAccount | null {
  if (payload == null) return null;

  const root = asRecord(payload);
  if (root?.data === null) return null;

  const data = unwrapData(payload);
  if (!data) return null;

  const accountNumber = pickString(data, [
    "accountNumber",
    "account_number",
    "accountNo",
    "nuban",
  ]);
  const bankName = pickString(data, ["bankName", "bank_name", "bank"]);
  const note = pickString(data, ["note"]);
  const accountName =
    pickString(data, [
      "accountName",
      "account_name",
      "fullnameName",
      "fullname_name",
      "name",
    ]) ?? accountNameFromNote(note);

  if (!accountNumber && !bankName && !accountName && !note) {
    const hasAnyVaKey = Object.keys(data).some((k) =>
      /account|bank|nuban|order|txRef|note/i.test(k),
    );
    if (!hasAnyVaKey) return null;
  }

  return {
    id: pickString(data, ["id"]),
    accountNumber,
    bankName,
    bankCode: pickString(data, ["bankCode", "bank_code"]),
    accountName,
    currency: pickString(data, ["currency"]),
    txRef: pickString(data, ["txRef", "tx_ref", "flwRef", "flw_ref"]),
    orderRef: pickString(data, ["orderRef", "order_ref"]),
    note,
    status: pickString(data, ["status", "account_status"]),
    isPermanent: data.isPermanent === true || data.is_permanent === true,
    identityHint: pickString(data, ["identityHint", "identity_hint"]),
    serviceFee: pickNumber(data, ["serviceFee", "service_fee"]),
    createdAt: pickString(data, ["createdAt", "created_at"]),
    raw: data,
  };
}

export const getFlutterwaveVirtualAccount = createAsyncThunk(
  "resident-flutterwave-va/getVirtualAccount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(BASE);
      return normalizeVirtualAccount(res.data);
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          getApiErrorMessage(error) || "Failed to load virtual account",
      });
    }
  },
);

export const createFlutterwaveVirtualAccount = createAsyncThunk(
  "resident-flutterwave-va/createVirtualAccount",
  async (payload: CreateFlutterwaveVaPayload, { rejectWithValue }) => {
    try {
      const body = {
        phonenumber: payload.phonenumber.trim(),
        nin: payload.nin.trim(),
      };

      const res = await axiosInstance.post(BASE, body);
      const account = normalizeVirtualAccount(res.data);
      if (!account?.accountNumber) {
        const dataMsg = asRecord(res.data)?.message;
        const message =
          (typeof dataMsg === "string" && dataMsg.trim()) ||
          "Virtual account was not created";
        return rejectWithValue({ message });
      }
      return account;
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          getApiErrorMessage(error) || "Failed to create virtual account",
      });
    }
  },
);
