export const BILL_INTEREST_MODULE_KEY = "bill-interest";

function moduleListHas(modules: unknown, moduleKey: string): boolean {
  if (!Array.isArray(modules)) return false;
  const key = moduleKey.trim().toLowerCase();
  return modules.some(
    (item) => typeof item === "string" && item.trim().toLowerCase() === key,
  );
}

/** True when the signed-in user (or their estate/company) has the given module. */
export function userHasModule(user: unknown, moduleKey: string): boolean {
  if (!user || typeof user !== "object") return false;
  const record = user as Record<string, unknown>;
  if (moduleListHas(record.modules, moduleKey)) return true;

  const estate = record.estateId;
  if (
    estate &&
    typeof estate === "object" &&
    !Array.isArray(estate) &&
    moduleListHas((estate as { modules?: unknown }).modules, moduleKey)
  ) {
    return true;
  }

  const company = record.company ?? record.companyId;
  if (
    company &&
    typeof company === "object" &&
    !Array.isArray(company) &&
    moduleListHas((company as { modules?: unknown }).modules, moduleKey)
  ) {
    return true;
  }

  if (Array.isArray(record.memberships)) {
    for (const membership of record.memberships) {
      if (!membership || typeof membership !== "object") continue;
      if (
        moduleListHas(
          (membership as { modules?: unknown }).modules,
          moduleKey,
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export function userHasBillInterestModule(user: unknown): boolean {
  return userHasModule(user, BILL_INTEREST_MODULE_KEY);
}

export function canUseBillInterest(
  user: unknown,
  estateModules: string[] = [],
): boolean {
  return (
    userHasBillInterestModule(user) ||
    estateModules.some(
      (key) => key.trim().toLowerCase() === BILL_INTEREST_MODULE_KEY,
    )
  );
}
