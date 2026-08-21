import type { ChatGroupRoleToAdd } from "@/types/community-group";

/** Values accepted by GET /api/v1/user-mgt/estate/{estateId}?role= */
export type EstateUserRoleFilter =
  | "resident"
  | "staff"
  | "security"
  | "company"
  | "admin"
  | "estate admin";

export type CompanyUserRoleFilter = EstateUserRoleFilter | "energy provider";

export const DEFAULT_ESTATE_USER_ROLE: EstateUserRoleFilter = "resident";

export const ESTATE_USER_ROLE_FILTER_OPTIONS: {
  label: string;
  value: EstateUserRoleFilter;
}[] = [
  { label: "Residents", value: "resident" },
  { label: "Staff", value: "staff" },
  { label: "Security", value: "security" },
  { label: "Company", value: "company" },
  { label: "Admins", value: "admin" },
  { label: "Estate admins", value: "estate admin" },
];

/** Estate scope: company users are filtered under Company, not Estate. */
export const ESTATE_SCOPE_ROLE_FILTER_OPTIONS =
  ESTATE_USER_ROLE_FILTER_OPTIONS.filter((o) => o.value !== "company");

/** Stats card label for the active role filter, e.g. "Total Residents". */
export function getEstateUserRoleTotalLabel(
  role: EstateUserRoleFilter,
): string {
  const option = ESTATE_USER_ROLE_FILTER_OPTIONS.find((o) => o.value === role);
  return option ? `Total ${option.label}` : "Total Users";
}

const ROLE_QUERY_VALUES: EstateUserRoleFilter[] = [
  "resident",
  "staff",
  "security",
  "company",
  "admin",
  "estate admin",
];

export function parseEstateUserRoleQuery(
  raw: string | null,
): EstateUserRoleFilter | null {
  if (!raw) return null;
  const normalized = decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/-/g, " ");
  return ROLE_QUERY_VALUES.includes(normalized as EstateUserRoleFilter)
    ? (normalized as EstateUserRoleFilter)
    : null;
}

/** Admin user management: residents, staff, and security only. */
export const ADMIN_USER_ROLE_FILTER_OPTIONS: {
  label: string;
  value: EstateUserRoleFilter;
}[] = ESTATE_USER_ROLE_FILTER_OPTIONS.filter(
  (o) =>
    o.value !== "company" &&
    o.value !== "estate admin" &&
    o.value !== "admin",
);

export function parseAdminUserRoleQuery(
  raw: string | null,
): EstateUserRoleFilter {
  const parsed = parseEstateUserRoleQuery(raw);
  if (
    parsed &&
    ADMIN_USER_ROLE_FILTER_OPTIONS.some((option) => option.value === parsed)
  ) {
    return parsed;
  }
  return DEFAULT_ESTATE_USER_ROLE;
}

/** Company user management: exclude estate admin & company; include energy provider. */
export const COMPANY_USER_ROLE_FILTER_OPTIONS: {
  label: string;
  value: CompanyUserRoleFilter;
}[] = [
  ...ESTATE_USER_ROLE_FILTER_OPTIONS.filter(
    (o) => o.value !== "estate admin" && o.value !== "company",
  ),
  { label: "Energy providers", value: "energy provider" },
];

export function parseCompanyUserRoleQuery(
  raw: string | null,
): CompanyUserRoleFilter {
  if (!raw) return DEFAULT_ESTATE_USER_ROLE;
  const normalized = decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/-/g, " ");
  if (normalized === "energy provider") return "energy provider";
  const parsed = parseEstateUserRoleQuery(raw);
  if (
    parsed &&
    COMPANY_USER_ROLE_FILTER_OPTIONS.some((option) => option.value === parsed)
  ) {
    return parsed;
  }
  return DEFAULT_ESTATE_USER_ROLE;
}

export function getCompanyUserRoleTotalLabel(
  role: CompanyUserRoleFilter,
): string {
  if (role === "energy provider") return "Total Energy providers";
  return getEstateUserRoleTotalLabel(role);
}

export function chatGroupRoleToApiRole(
  role: ChatGroupRoleToAdd,
): EstateUserRoleFilter {
  switch (role) {
    case "RESIDENT":
      return "resident";
    case "ADMIN":
      return "admin";
    case "SECURITY":
      return "security";
    case "STAFF":
      return "staff";
    case "ESTATE_ADMIN":
      return "estate admin";
    default:
      return "resident";
  }
}
