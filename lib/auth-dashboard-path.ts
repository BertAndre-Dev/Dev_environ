/** Default dashboard home path for a given user role. */
export function getDashboardPathForRole(
  role: string | undefined | null,
): string {
  const r = (role ?? "").toString().toLowerCase().trim();
  switch (r) {
    case "super admin":
      return "/dashboard/super-admin/dashboard";
    case "admin":
      return "/dashboard/admin/overview";
    case "security":
      return "/dashboard/security/visitor-management";
    case "estate admin":
      return "/dashboard/estate-admin/transactions";
    case "resident":
      return "/dashboard/resident/bills";
    case "company":
      return "/dashboard/company/asset";
    case "energy provider":
      return "/dashboard/energy-provider/wallet";
    case "staff":
      return "/dashboard/staff/maintenance";
    default:
      return "/dashboard/resident/bills";
  }
}

const ROLE_PATH_SEGMENTS: Record<string, string> = {
  "super admin": "super-admin",
  admin: "admin",
  security: "security",
  "estate admin": "estate-admin",
  resident: "resident",
  company: "company",
  "energy provider": "energy-provider",
  staff: "staff",
};

function normalizeRole(role: string | undefined | null): string {
  return (role ?? "").toString().toLowerCase().trim();
}

function roleToPathSegment(role: string | undefined | null): string | null {
  return ROLE_PATH_SEGMENTS[normalizeRole(role)] ?? null;
}

/**
 * After switching membership, prefer staying on the equivalent page.
 * Same role → keep current path. Different role → swap role segment when possible.
 */
export function getPostMembershipSwitchPath(
  currentPath: string,
  nextRole: string | undefined | null,
  previousRole?: string | undefined | null,
): string {
  const next = normalizeRole(nextRole);
  const previous = normalizeRole(previousRole);
  const pathname = currentPath.split("?")[0] || "/";

  // Same role (typical estate switch): remain on bills, users, etc.
  if (next && previous && next === previous && pathname.startsWith("/dashboard/")) {
    return pathname;
  }

  const nextSegment = roleToPathSegment(next);
  const previousSegment = roleToPathSegment(previous);

  if (nextSegment && previousSegment && pathname.startsWith(`/dashboard/${previousSegment}`)) {
    const mapped = pathname.replace(
      `/dashboard/${previousSegment}`,
      `/dashboard/${nextSegment}`,
    );
    if (mapped.startsWith(`/dashboard/${nextSegment}`)) {
      return mapped;
    }
  }

  // Already under the next role's area (e.g. soft reload)
  if (nextSegment && pathname.startsWith(`/dashboard/${nextSegment}`)) {
    return pathname;
  }

  return getDashboardPathForRole(nextRole);
}
