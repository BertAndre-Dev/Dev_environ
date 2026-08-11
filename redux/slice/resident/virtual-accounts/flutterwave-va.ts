import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

const BASE = "/api/v1/payment-mgt/virtual-accounts/flutterwave";

export const BVN_CONSENT_STORAGE_KEY = "flw_bvn_consent";
export const BVN_CONFIRM_LOCK_KEY = "flw_bvn_confirm_lock";

export interface BvnConsentStored {
  reference: string;
  bvn: string;
  phonenumber: string;
}

export interface FlutterwaveVirtualAccount {
  accountNumber: string | null;
  bankName: string | null;
  accountName: string | null;
  orderRef: string | null;
  flwRef: string | null;
  status: string | null;
  raw: Record<string, unknown> | null;
}

export interface BvnVerificationStatus {
  verified: boolean;
  status: string | null;
  reference: string | null;
  message: string | null;
  raw: Record<string, unknown> | null;
}

export interface InitiateBvnPayload {
  bvn: string;
  redirectUrl: string;
}

export interface InitiateBvnResult {
  consentUrl: string | null;
  reference: string | null;
  raw: Record<string, unknown> | null;
}

export interface ConfirmBvnPayload {
  reference: string;
}

/** Exactly one of BVN or NIN — never both. */
export type CreateFlutterwaveVaPayload =
  | { phonenumber: string; bvn: string; nin?: never }
  | { phonenumber: string; nin: string; bvn?: never };

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

function unwrapData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data);
  return nested ?? root;
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
  const accountName = pickString(data, [
    "accountName",
    "account_name",
    "fullnameName",
    "fullname_name",
    "name",
  ]);

  if (!accountNumber && !bankName && !accountName) {
    const hasAnyVaKey = Object.keys(data).some((k) =>
      /account|bank|nuban|order|flw/i.test(k),
    );
    if (!hasAnyVaKey) return null;
  }

  return {
    accountNumber,
    bankName,
    accountName,
    orderRef: pickString(data, ["orderRef", "order_ref"]),
    flwRef: pickString(data, ["flwRef", "flw_ref", "flutterwaveRef"]),
    status: pickString(data, ["status", "account_status"]),
    raw: data,
  };
}

export function normalizeBvnStatus(payload: unknown): BvnVerificationStatus {
  const data = unwrapData(payload);
  const status = pickString(data, ["status", "verificationStatus", "bvnStatus"]);
  const reference = pickString(data, ["reference", "ref"]);
  const message = pickString(data, ["message"]);

  const verifiedFlag =
    data?.verified === true ||
    data?.isVerified === true ||
    data?.bvnVerified === true;

  const statusLower = (status ?? "").toLowerCase();
  const verified =
    verifiedFlag ||
    statusLower === "verified" ||
    statusLower === "success" ||
    statusLower === "successful" ||
    statusLower === "completed" ||
    statusLower === "confirmed";

  return {
    verified,
    status,
    reference,
    message,
    raw: data,
  };
}

export function normalizeInitiateBvn(payload: unknown): InitiateBvnResult {
  const data = unwrapData(payload);
  return {
    consentUrl: pickString(data, [
      "consentUrl",
      "consent_url",
      "redirectUrl",
      "redirect_url",
      "url",
      "link",
    ]),
    reference: pickString(data, ["reference", "ref", "flw_ref", "flwRef"]),
    raw: data,
  };
}

export function saveBvnConsentSession(data: BvnConsentStored): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BVN_CONSENT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function readBvnConsentSession(): BvnConsentStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BVN_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BvnConsentStored;
    if (
      parsed &&
      typeof parsed.reference === "string" &&
      typeof parsed.bvn === "string" &&
      typeof parsed.phonenumber === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearBvnConsentSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BVN_CONSENT_STORAGE_KEY);
    sessionStorage.removeItem(BVN_CONFIRM_LOCK_KEY);
  } catch {
    // ignore
  }
}

export function tryAcquireBvnConfirmLock(reference: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const existing = sessionStorage.getItem(BVN_CONFIRM_LOCK_KEY);
    if (existing === reference) return false;
    sessionStorage.setItem(BVN_CONFIRM_LOCK_KEY, reference);
    return true;
  } catch {
    return true;
  }
}

export const getFlutterwaveBvnStatus = createAsyncThunk(
  "resident-flutterwave-va/getBvnStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`${BASE}/bvn/status`);
      return normalizeBvnStatus(res.data);
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error) || "Failed to load BVN status",
      });
    }
  },
);

export const initiateFlutterwaveBvn = createAsyncThunk(
  "resident-flutterwave-va/initiateBvn",
  async (payload: InitiateBvnPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`${BASE}/bvn/initiate`, {
        bvn: payload.bvn.trim(),
        redirectUrl: payload.redirectUrl,
      });
      const normalized = normalizeInitiateBvn(res.data);
      if (!normalized.consentUrl && !normalized.reference) {
        const dataMsg = asRecord(res.data)?.message;
        const message =
          (typeof dataMsg === "string" && dataMsg.trim()) ||
          "BVN consent could not be started";
        return rejectWithValue({ message });
      }
      return normalized;
    } catch (error: unknown) {
      return rejectWithValue({
        message: getApiErrorMessage(error) || "Failed to initiate BVN consent",
      });
    }
  },
);

export const confirmFlutterwaveBvn = createAsyncThunk(
  "resident-flutterwave-va/confirmBvn",
  async (payload: ConfirmBvnPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`${BASE}/bvn/confirm`, {
        reference: payload.reference.trim(),
      });
      return normalizeBvnStatus(res.data);
    } catch (error: unknown) {
      return rejectWithValue({
        message:
          getApiErrorMessage(error) || "Failed to confirm BVN verification",
      });
    }
  },
);

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
      const body: Record<string, string> = {
        phonenumber: payload.phonenumber.trim(),
      };
      if ("nin" in payload && payload.nin?.trim()) {
        body.nin = payload.nin.trim();
      } else if ("bvn" in payload && payload.bvn?.trim()) {
        body.bvn = payload.bvn.trim();
      } else {
        return rejectWithValue({
          message: "Provide either BVN or NIN (not both).",
        });
      }

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
