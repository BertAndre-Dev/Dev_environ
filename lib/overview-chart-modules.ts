import { isNavModuleEnabled } from "@/lib/nav-module-filter";

export type OverviewChartId =
  | "userSummary"
  | "roleBreakdown"
  | "meterSummary"
  | "billsSummary"
  | "complaintsSummary"
  | "complaintsDashboard";

/** Analytics widgets need `reporting` plus the domain module they describe. */
const OVERVIEW_CHART_MODULES: Record<OverviewChartId, readonly string[]> = {
  userSummary: ["reporting", "users"],
  roleBreakdown: ["reporting", "users"],
  meterSummary: ["reporting", "meter"],
  billsSummary: ["reporting", "bills"],
  complaintsSummary: ["reporting", "complaints"],
  complaintsDashboard: ["reporting", "complaints"],
};

function pushModuleList(target: string[], modules: unknown) {
  if (!Array.isArray(modules)) return;
  for (const item of modules) {
    if (typeof item === "string" && item.trim()) {
      target.push(item.trim());
    }
  }
}

/**
 * Modules assigned to the signed-in user (designation / invite).
 * Returns `null` when assignment is unknown so callers can fall back to estate modules.
 */
export function getUserAssignedModules(user: unknown): string[] | null {
  if (!user || typeof user !== "object") return null;
  const record = user as Record<string, unknown>;
  const collected: string[] = [];

  pushModuleList(collected, record.modules);

  const designation = record.designation;
  if (
    designation &&
    typeof designation === "object" &&
    !Array.isArray(designation)
  ) {
    pushModuleList(collected, (designation as { modules?: unknown }).modules);
  }

  if (Array.isArray(record.memberships)) {
    for (const membership of record.memberships) {
      if (!membership || typeof membership !== "object") continue;
      pushModuleList(
        collected,
        (membership as { modules?: unknown }).modules,
      );
    }
  }

  if (collected.length > 0) return Array.from(new Set(collected));
  if (Array.isArray(record.modules)) return [];
  return null;
}

export function resolveOverviewModules(
  user: unknown,
  estateModules: string[],
): string[] {
  return getUserAssignedModules(user) ?? estateModules;
}

export function canShowOverviewChart(
  modules: string[],
  chart: OverviewChartId,
): boolean {
  return OVERVIEW_CHART_MODULES[chart].every((key) =>
    isNavModuleEnabled(key, modules),
  );
}
