/** Sidebar labels always shown (not gated by estate modules). */
export const NAV_ALWAYS_VISIBLE_LABELS = new Set([
  "Overview",
  "Settings",
  "Logout",
  "Energy Provider Management",
  "Notifications",
  "Map",
]);

/** Security role pages that are not estate modules. */
export const NAV_SECURITY_STATIC_LABELS = new Set(["Activity Log"]);

export type NavItemWithModule = {
  label: string;
  module?: string;
  moduleKey?: string;
  children?: NavItemWithModule[];
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
  if (moduleKey === "revenue" || moduleKey === "revenues") {
    return (
      estateModules.includes("revenue") || estateModules.includes("revenues")
    );
  }
  if (moduleKey === "asset" || moduleKey === "assets") {
    return (
      estateModules.includes("asset") || estateModules.includes("assets")
    );
  }
  if (
    moduleKey === "asset-maintenance" ||
    moduleKey === "assetMaintenance" ||
    moduleKey === "asset_maintenance"
  ) {
    return (
      estateModules.includes("asset-maintenance") ||
      estateModules.includes("assetMaintenance") ||
      estateModules.includes("asset_maintenance")
    );
  }
  if (moduleKey === "request" || moduleKey === "requests") {
    return (
      estateModules.includes("request") || estateModules.includes("requests")
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

  return items.flatMap((item) => {
    if (alwaysVisible.has(item.label)) return [item];

    const children = item.children;
    if (children?.length) {
      const filteredChildren = children.filter((child) => {
        const key = child.moduleKey ?? child.module;
        if (!key) return true;
        return isNavModuleEnabled(key, estateModules);
      });

      const parentKey = item.moduleKey ?? item.module;
      const parentEnabled = parentKey
        ? isNavModuleEnabled(parentKey, estateModules)
        : false;

      if (filteredChildren.length === 0 && !parentEnabled) return [];
      if (filteredChildren.length === 0) return [];

      return [{ ...item, children: filteredChildren }];
    }

    const key = item.moduleKey ?? item.module;
    if (!key) return [];
    return isNavModuleEnabled(key, estateModules) ? [item] : [];
  });
}
