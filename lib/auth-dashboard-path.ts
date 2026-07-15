/** Default dashboard home path for a given user role. */
export function getDashboardPathForRole(
  role: string | undefined | null,
): string {
  const r = (role ?? "").toString().toLowerCase().trim();
  switch (r) {
    case "super admin":
      return "/dashboard/super-admin/user";
    case "admin":
      return "/dashboard/admin/user";
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
