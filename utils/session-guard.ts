import { jwtDecode } from "jwt-decode";

export const TAB_SESSION_OWNER_KEY = "tab_session_owner";
export const AUTH_LOGOUT_REASON_KEY = "auth_logout_reason";
export const SESSION_CONFLICT_REASON = "session_conflict";

type AccessTokenClaims = {
  email?: string;
  sub?: string;
  userEmail?: string;
};

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

export function decodeAccessTokenEmail(token: string): string | null {
  try {
    const decoded = jwtDecode<AccessTokenClaims>(token);
    return (
      normalizeEmail(decoded.email) ??
      normalizeEmail(decoded.userEmail) ??
      normalizeEmail(decoded.sub)
    );
  } catch {
    return null;
  }
}

/** Binds this browser tab to a single account for the lifetime of the tab session. */
export function bindTabSessionOwner(email: unknown): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  sessionStorage.setItem(TAB_SESSION_OWNER_KEY, normalized);
}

export function getTabSessionOwner(): string | null {
  if (typeof window === "undefined") return null;
  return normalizeEmail(sessionStorage.getItem(TAB_SESSION_OWNER_KEY));
}

export function clearTabSessionOwner(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TAB_SESSION_OWNER_KEY);
}

/**
 * Ensures a tab has an owner when loading an existing session (e.g. page reload).
 * Does not re-bind if an owner is already set.
 */
export function ensureTabSessionOwner(email: unknown): void {
  if (getTabSessionOwner()) return;
  bindTabSessionOwner(email);
}

/** Returns true when the user/token still belongs to this tab's bound account. */
export function isTabSessionValid(
  userEmail?: unknown,
  accessToken?: string | null,
): boolean {
  const owner = getTabSessionOwner();
  if (!owner) return true;

  const normalizedUserEmail = normalizeEmail(userEmail);
  if (normalizedUserEmail && normalizedUserEmail !== owner) return false;

  if (accessToken) {
    const tokenEmail = decodeAccessTokenEmail(accessToken);
    if (tokenEmail && tokenEmail !== owner) return false;
  }

  return true;
}

export function markSessionConflictLogout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, SESSION_CONFLICT_REASON);
}

export function consumeAuthLogoutReason(): string | null {
  if (typeof window === "undefined") return null;
  const reason = sessionStorage.getItem(AUTH_LOGOUT_REASON_KEY);
  if (reason) sessionStorage.removeItem(AUTH_LOGOUT_REASON_KEY);
  return reason;
}

/** Removes stale auth keys left from the pre-sessionStorage localStorage era. */
export function purgeLegacySharedAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of ["auth", "user", "token", "persist:root"]) {
    localStorage.removeItem(key);
  }
}
