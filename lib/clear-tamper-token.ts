export interface ClearTamperTokenData {
  meterNumber?: string;
  maintainToken?: string;
  token?: string;
  [key: string]: unknown;
}

export interface ClearTamperTokenResponse {
  success?: boolean;
  message?: string;
  data?: ClearTamperTokenData | string;
  maintainToken?: string;
  token?: string;
}

/** Extract STS clear-tamper / maintain token from API payload. */
export function extractClearTamperToken(
  payload: ClearTamperTokenResponse | undefined,
): string | null {
  if (!payload) return null;
  if (typeof payload.data === "string" && payload.data.trim()) {
    return payload.data.trim();
  }
  const data =
    payload.data && typeof payload.data === "object" ? payload.data : undefined;
  const candidates = [
    data?.maintainToken,
    data?.token,
    payload.maintainToken,
    payload.token,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
