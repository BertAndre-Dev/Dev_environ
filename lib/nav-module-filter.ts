/** Sidebar labels always shown (not gated by estate modules). */
export const NAV_ALWAYS_VISIBLE_LABELS = new Set([
  "Overview",
  "Settings",
  "Logout",
]);

/** Security role pages that are not estate modules. */
export const NAV_SECURITY_STATIC_LABELS = new Set(["Activity Log"]);

export type NavItemWithModule = {
  label: string;
  module?: string;
  moduleKey?: string;
};

export function isNavModuleEnabled(
  moduleKey: string,
  estateModules: string[],
): boolean {
  if (moduleKey === "expense" || moduleKey === "expenses") {
    return (
      estateModules.includes("expense") || estateModules.includes("expenses")
    );
  }
  if (moduleKey === "asset" || moduleKey === "assets") {
    return (
      estateModules.includes("asset") || estateModules.includes("assets")
    );
  }
  return estateModules.includes(moduleKey);
}

export function filterNavItemsByEstateModules<T extends NavItemWithModule>(
  items: T[],
  estateModules: string[],
  options?: { role?: string },
): T[] {
  const alwaysVisible = new Set(NAV_ALWAYS_VISIBLE_LABELS);
  if (options?.role === "security") {
    for (const label of NAV_SECURITY_STATIC_LABELS) {
      alwaysVisible.add(label);
    }
  }

  if (!Array.isArray(estateModules) || estateModules.length === 0) {
    return items.filter((item) => alwaysVisible.has(item.label));
  }

  return items.filter((item) => {
    if (alwaysVisible.has(item.label)) return true;

    const key = item.moduleKey ?? item.module;
    if (!key) return false;

    return isNavModuleEnabled(key, estateModules);
  });
}
