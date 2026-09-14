import { userDesignationId } from "@/lib/designations";
import { isNavModuleEnabled } from "@/lib/nav-module-filter";

export type OverviewChartId =
  | "userSummary"
  | "roleBreakdown"
  | "meterSummary"
  | "billsSummary"
  | "complaintsSummary"
  | "complaintsDashboard";

/** Overview widgets follow the domain module the staff/admin was assigned. */
const OVERVIEW_CHART_MODULES: Record<OverviewChartId, readonly string[]> = {
  userSummary: ["users"],
  roleBreakdown: ["users"],
  meterSummary: ["meter"],
  billsSummary: ["bills"],
  complaintsSummary: ["complaints"],
  complaintsDashboard: ["complaints"],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function moduleKeyFromItem(item: unknown): string {
  if (typeof item === "string") return item.trim();
  const record = asRecord(item);
  if (!record) return "";
  for (const key of ["key", "moduleKey", "module", "name", "id"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pushModuleList(target: string[], modules: unknown) {
  if (!Array.isArray(modules)) return;
  for (const item of modules) {
    const key = moduleKeyFromItem(item);
    if (key) target.push(key);
  }
}

function pushDesignationModules(target: string[], designation: unknown) {
  const record = asRecord(designation);
  if (!record) return;
  pushModuleList(target, record.modules);
  pushModuleList(target, record.assignedModules);
}

function entityId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const record = asRecord(value);
  if (!record) return "";
  const id = record.id ?? record._id;
  return typeof id === "string" ? id.trim() : "";
}

/** Designation id from `/me` (string, populated object, or membership). */
export function extractUserDesignationId(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const record = user as Record<string, unknown>;
  return (
    entityId(record.designationId) ||
    entityId(record.designation) ||
    userDesignationId({
      designationId: entityId(record.designationId) || undefined,
      memberships: Array.isArray(record.memberships)
        ? record.memberships.map((membership) => {
            const entry = asRecord(membership);
            return {
              designationId: entry
                ? entityId(entry.designationId) || entityId(entry.designation)
                : "",
              isCurrent: Boolean(entry?.isCurrent),
            };
          })
        : [],
    })
  );
}

/**
 * Modules assigned to the signed-in user (designation / invite).
 * Returns `null` when assignment is unknown so staff can load the designation
 * instead of falling back to the estate's full module list.
 */
export function getUserAssignedModules(user: unknown): string[] | null {
  if (!user || typeof user !== "object") return null;
  const record = user as Record<string, unknown>;
  const collected: string[] = [];

  pushModuleList(collected, record.modules);
  pushModuleList(collected, record.assignedModules);
  pushDesignationModules(collected, record.designation);
  pushDesignationModules(collected, record.designationId);

  if (Array.isArray(record.memberships)) {
    for (const membership of record.memberships) {
      const entry = asRecord(membership);
      if (!entry) continue;
      pushModuleList(collected, entry.modules);
      pushModuleList(collected, entry.assignedModules);
      pushDesignationModules(collected, entry.designation);
      pushDesignationModules(collected, entry.designationId);
    }
  }

  if (collected.length > 0) return Array.from(new Set(collected));
  return null;
}

export function resolveOverviewModules(
  user: unknown,
  estateModules: string[],
): string[] {
  const assigned = getUserAssignedModules(user);
  if (assigned && assigned.length > 0) return assigned;
  return estateModules;
}

export function canShowOverviewChart(
  modules: string[],
  chart: OverviewChartId,
): boolean {
  return OVERVIEW_CHART_MODULES[chart].every((key) =>
    isNavModuleEnabled(key, modules),
  );
}
