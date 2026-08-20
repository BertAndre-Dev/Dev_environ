export type SubscriptionPlan = {
  key: string;
  name: string;
  staffAssignableModules: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (!record) return [];
  const nested = record.data;
  if (Array.isArray(nested)) return nested;
  const nestedRecord = asRecord(nested);
  if (nestedRecord) {
    for (const key of ["plans", "items", "docs", "results", "rows"]) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) return value;
    }
  }
  for (const key of ["plans", "items", "docs", "results", "rows"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

export function parseSubscriptionPlan(raw: unknown): SubscriptionPlan | null {
  const record = asRecord(raw);
  if (!record) {
    if (typeof raw === "string" && raw.trim()) {
      const key = raw.trim().toLowerCase();
      return { key, name: raw.trim(), staffAssignableModules: [] };
    }
    return null;
  }

  const key = asString(
    record.key ?? record.plan ?? record.slug ?? record.code ?? record.id,
  ).toLowerCase();
  if (!key) return null;

  const name = asString(record.name ?? record.label) || key;
  const modulesRaw = record.staffAssignableModules ?? record.modules;
  const staffAssignableModules = Array.isArray(modulesRaw)
    ? modulesRaw.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

  return { key, name, staffAssignableModules };
}

export function extractSubscriptionPlans(payload: unknown): SubscriptionPlan[] {
  const seen = new Set<string>();
  const plans: SubscriptionPlan[] = [];
  for (const item of extractArray(payload)) {
    const plan = parseSubscriptionPlan(item);
    if (!plan || seen.has(plan.key)) continue;
    seen.add(plan.key);
    plans.push(plan);
  }
  return plans;
}
