export type PlanRates = {
  vendingPercent: number;
  billsPercent: number;
};

export type SubscriptionPlan = {
  key: string;
  name: string;
  description: string;
  rates: PlanRates | null;
  modules: string[];
  staffAssignableModules: string[];
};

export const DEFAULT_PLAN = "freemium";

const FREEMIUM_MODULES = [
  "estate",
  "address",
  "users",
  "notifications",
  "visitor",
  "meter",
] as const;

const STANDARD_MODULES = [
  "bills",
  "meter",
  "rent",
  "marketplace",
  "visitor",
  "complaints",
  "announcements",
  "wallet",
  "transactions",
  "comments",
  "address",
  "users",
  "notifications",
  "chat",
  "estate",
  "support",
] as const;

const CLASSIC_MODULES = [
  ...STANDARD_MODULES,
  "expense",
  "revenue",
  "reporting",
  "bill-interest",
  "operations-reporting",
] as const;

const PREMIUM_MODULES = [
  "bills",
  "rent",
  "meter",
  "marketplace",
  "visitor",
  "complaints",
  "announcements",
  "wallet",
  "transactions",
  "comments",
  "address",
  "expense",
  "revenue",
  "reporting",
  "users",
  "chat",
  "company",
  "asset",
  "asset-category",
  "notifications",
  "operations-reporting",
  "asset-maintenance",
  "estate",
  "support",
  "requests",
  "rates",
  "bill-interest",
  "designation",
] as const;

function catalogPlan(
  key: string,
  name: string,
  description: string,
  rates: PlanRates,
  modules: readonly string[],
): SubscriptionPlan {
  const list = [...modules];
  return {
    key,
    name,
    description,
    rates,
    modules: list,
    staffAssignableModules: list,
  };
}

export const FALLBACK_PLANS: SubscriptionPlan[] = [
  catalogPlan(
    "freemium",
    "Freemium",
    "Onboarding-only: estate, addresses, users, notifications, visitor management, and meter assignment. Meters are optional when inviting home owners. Vending is not available until you upgrade. Assign meters to every address before upgrading to a paid plan.",
    { vendingPercent: 0, billsPercent: 0 },
    FREEMIUM_MODULES,
  ),
  catalogPlan(
    "standard",
    "Standard",
    "Core estate operations. Lowest platform take on vending.",
    { vendingPercent: 2, billsPercent: 3 },
    STANDARD_MODULES,
  ),
  catalogPlan(
    "classic",
    "Classic",
    "Standard plus finance (expense, revenue, reporting), bill interest, and operations reporting.",
    { vendingPercent: 3.25, billsPercent: 2.85 },
    CLASSIC_MODULES,
  ),
  catalogPlan(
    "premium",
    "Premium",
    "Full module catalog, including asset management, staff designations, and bill collection dates.",
    { vendingPercent: 4.25, billsPercent: 2.65 },
    PREMIUM_MODULES,
  ),
];

export function formatVendAmount(value: unknown): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function labelForPlan(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const key = value.trim().toLowerCase();
  const known = FALLBACK_PLANS.find((plan) => plan.key === key);
  if (known) return known.name;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function normalizePlanKey(value: unknown): string {
  if (typeof value === "string") {
    const plan = value.trim().toLowerCase();
    if (plan) return plan;
  }
  return DEFAULT_PLAN;
}

export function toCompanyWriteBody(data: {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive?: boolean;
  plan?: string;
}) {
  return {
    name: data.name.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    country: data.country.trim(),
    isActive: data.isActive ?? true,
    plan: normalizePlanKey(data.plan),
  };
}

export function toEstateWriteBody(data: {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isActive?: boolean;
  plan?: string;
  visitorVerificationMode?: string;
}) {
  return {
    ...toCompanyWriteBody(data),
    ...(data.visitorVerificationMode
      ? { visitorVerificationMode: data.visitorVerificationMode }
      : {}),
  };
}

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
      return {
        key,
        name: raw.trim(),
        description: "",
        rates: null,
        modules: [],
        staffAssignableModules: [],
      };
    }
    return null;
  }

  const key = asString(
    record.key ?? record.plan ?? record.slug ?? record.code ?? record.id,
  ).toLowerCase();
  if (!key) return null;

  const name = asString(record.name ?? record.label) || key;
  const description = asString(record.description);
  const modules = parseModuleList(record.modules);
  const staffAssignableModules = parseModuleList(
    record.staffAssignableModules ?? record.modules,
  );
  const ratesRecord = asRecord(record.rates);
  const vendingPercent = parsePercent(ratesRecord?.vendingPercent);
  const billsPercent = parsePercent(ratesRecord?.billsPercent);
  const rates =
    vendingPercent === null || billsPercent === null
      ? null
      : { vendingPercent, billsPercent };

  return {
    key,
    name,
    description,
    rates,
    modules,
    staffAssignableModules,
  };
}

function parseModuleList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim());
}

function parsePercent(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export function formatPlanPercent(value: number): string {
  return `${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(value)}%`;
}

export function formatPlanRate(plan: SubscriptionPlan): string {
  if (!plan.rates) return "";
  return `Vending ${formatPlanPercent(plan.rates.vendingPercent)} · Bills ${formatPlanPercent(plan.rates.billsPercent)}`;
}

export function extractDefaultPlan(payload: unknown): string {
  const record = asRecord(payload);
  const key = asString(record?.defaultPlan).toLowerCase();
  return key || DEFAULT_PLAN;
}

export async function fetchPublicPlansCatalog(): Promise<{
  plans: SubscriptionPlan[];
  defaultPlan: string;
}> {
  const response = await fetch("/api/v1/plans", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Plans request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const plans = extractSubscriptionPlans(payload);
  if (!plans.length) {
    return { plans: FALLBACK_PLANS, defaultPlan: DEFAULT_PLAN };
  }

  const requested = extractDefaultPlan(payload);
  const defaultPlan = plans.some((item) => item.key === requested)
    ? requested
    : (plans[0]?.key ?? DEFAULT_PLAN);

  return { plans, defaultPlan };
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
