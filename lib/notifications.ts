/**
 * Map backend notification actionUrl values to in-app dashboard routes.
 */

const ROLE_BASE: Record<string, string> = {
  admin: "/dashboard/admin",
  "estate admin": "/dashboard/estate-admin",
  "super admin": "/dashboard/super-admin",
  resident: "/dashboard/resident",
  staff: "/dashboard/staff",
  company: "/dashboard/company",
  security: "/dashboard/security",
  "energy provider": "/dashboard/energy-provider",
};

function normalizeRole(role: string): string {
  return role.toLowerCase().trim();
}

function roleDashboardBase(role: string): string {
  return ROLE_BASE[normalizeRole(role)] ?? "/dashboard/admin";
}

/** Full inbox page path for the signed-in role. */
export function getNotificationsInboxPath(
  role: string | null | undefined,
): string {
  return `${roleDashboardBase(role || "admin")}/notifications`;
}

function complaintHref(role: string, complaintId: string): string {
  const normalized = normalizeRole(role);
  if (normalized === "resident") {
    return `/dashboard/resident/maintenance?id=${complaintId}`;
  }
  if (normalized === "staff") {
    return `/dashboard/staff/maintenance?id=${complaintId}`;
  }
  return `${roleDashboardBase(role)}/maintenance?id=${complaintId}`;
}

export function resolveNotificationHref(
  actionUrl: string | undefined,
  role: string,
): string | null {
  if (!actionUrl?.trim()) return null;
  const url = actionUrl.trim();

  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/dashboard")) return url;

  const complaintMatch = /^\/complaints\/([^/?#]+)/i.exec(url);
  if (complaintMatch?.[1]) {
    return complaintHref(role, complaintMatch[1]);
  }

  const base = roleDashboardBase(role);
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}

export function formatNotificationTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
