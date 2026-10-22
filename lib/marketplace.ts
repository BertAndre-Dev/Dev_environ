export const MARKETPLACE_STATUSES = [
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "INACTIVE",
  "EXPIRED",
] as const;

export type MarketplaceStatus = (typeof MARKETPLACE_STATUSES)[number];

export const MARKETPLACE_AUDIENCES = [
  "WITHIN_ESTATE",
  "OTHER_ESTATES",
  "ALL_ESTATES",
] as const;

export type MarketplaceAudience = (typeof MARKETPLACE_AUDIENCES)[number];

export const MARKETPLACE_CATEGORIES = [
  "Fashion",
  "Automobile",
  "Furniture",
  "Carpentry",
  "Insurance",
  "Food & Drinks",
  "Services",
  "Electronics",
  "Real Estate",
  "Other",
] as const;

export const MARKETPLACE_MAX_IMAGES = 5;
export const MARKETPLACE_MAX_VIDEOS = 2;

export const MARKETPLACE_PRESS =
  "cursor-pointer transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100";

export const CREATOR_ROLES = new Set([
  "resident",
  "admin",
  "estate admin",
  "company",
  "energy provider",
  "super admin",
]);

const PLATFORM_CREATOR_ROLES = new Set([
  "super admin",
  "company",
  "energy provider",
]);

export function isPlatformCreator(role: string | null | undefined): boolean {
  return PLATFORM_CREATOR_ROLES.has((role ?? "").toString().trim().toLowerCase());
}

/** Estate chosen for GET /api/v1/marketplace when the role is not estate-bound. */
export const MARKETPLACE_FEED_ESTATE_KEY = "bertahub.marketplace.feedEstateId";

/** Company, energy provider, and super admin must pass estateId. Other roles use the JWT estate. */
export function marketplaceFeedNeedsEstateId(
  role: string | null | undefined,
): boolean {
  return isPlatformCreator(role);
}

export function normalizeMarketplaceStatus(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, "_").toUpperCase();
}

export function isMarketplaceStatus(value: string): value is MarketplaceStatus {
  return (MARKETPLACE_STATUSES as readonly string[]).includes(value);
}

export function marketplaceStatusLabel(value: unknown): string {
  const status = normalizeMarketplaceStatus(value);
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending approval";
    case "ACTIVE":
      return "Active";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    case "INACTIVE":
      return "Inactive";
    case "EXPIRED":
      return "Expired";
    default:
      return status ? status.replaceAll("_", " ").toLowerCase() : "Unknown";
  }
}

function namedText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string") return name.trim();
  }
  return "";
}

export function marketplaceAudienceLabel(
  value: unknown,
  estateName?: string | null,
): string {
  const named = typeof estateName === "string" ? estateName.trim() : "";
  const audience =
    typeof value === "string" ? value.trim().toUpperCase() : "";
  if (audience === "OTHER_ESTATES") return "Select estates";
  if (audience === "ALL_ESTATES") return "All estates";
  return named || "This estate";
}

type EstateNameSource = {
  audience?: unknown;
  estateName?: string | null;
  estate?: unknown;
  estateId?: unknown;
};

/** Name attached to a listing, when the API includes it. */
export function adEstateName(item: EstateNameSource): string {
  return (
    namedText(item.estateName) ||
    namedText(item.estate) ||
    namedText(item.estateId)
  );
}

export function audienceLabelForAd(
  item: EstateNameSource,
  options?: {
    fallbackName?: string | null;
    estates?: ReadonlyArray<{ label: string; value: string }>;
    selectedEstateId?: string | null;
  },
): string {
  const direct = adEstateName(item);
  const estateId =
    resolveEstateId(item.estateId) || resolveEstateId(item.estate);
  const fromList =
    estateId && options?.estates
      ? options.estates.find((row) => row.value === estateId)?.label ?? ""
      : "";
  const selectedId = options?.selectedEstateId?.trim() ?? "";
  const fallbackName = options?.fallbackName?.trim() ?? "";
  const sameEstate = !estateId || !selectedId || estateId === selectedId;
  const fallback = sameEstate ? fallbackName : "";
  return marketplaceAudienceLabel(
    item.audience,
    direct || fromList || fallback,
  );
}

export function resolveCurrentEstateName(
  user: unknown,
  memberships: ReadonlyArray<{
    isCurrent?: boolean | null;
    isActive?: boolean | null;
    estateName?: string | null;
    estateId?: unknown;
  }> = [],
): string {
  const record =
    user && typeof user === "object"
      ? (user as Record<string, unknown>)
      : {};
  const current =
    memberships.find((item) => item.isCurrent) ??
    memberships.find((item) => item.isActive && (item.estateName || item.estateId)) ??
    memberships.find((item) => item.estateName || namedText(item.estateId));
  const fromMembership =
    namedText(current?.estateName) || namedText(current?.estateId);
  return (
    fromMembership ||
    namedText(record.estateName) ||
    namedText(record.estate) ||
    namedText(record.estateId)
  );
}

export function audiencesForRole(role: string | null | undefined): MarketplaceAudience[] {
  if (isPlatformCreator(role)) {
    return ["OTHER_ESTATES", "ALL_ESTATES"];
  }
  return [...MARKETPLACE_AUDIENCES];
}

export function defaultAudienceForRole(
  role: string | null | undefined,
): MarketplaceAudience {
  const normalized = (role ?? "").toString().trim().toLowerCase();
  if (normalized === "super admin") return "ALL_ESTATES";
  if (normalized === "company" || normalized === "energy provider") {
    return "OTHER_ESTATES";
  }
  return "WITHIN_ESTATE";
}

export function resolveEstateId(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const o = raw as { id?: string; _id?: string };
    return String(o._id || o.id || "").trim();
  }
  return "";
}

export function toDateInputValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match?.[1] ?? "";
}

export function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function plusDaysDateInput(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function marketplacePathForRole(role: string | null | undefined): string {
  const normalized = (role ?? "").toString().trim().toLowerCase();
  switch (normalized) {
    case "super admin":
      return "/dashboard/super-admin/marketplace";
    case "company":
      return "/dashboard/company/marketplace";
    case "admin":
      return "/dashboard/admin/marketplace";
    case "estate admin":
      return "/dashboard/estate-admin/marketplace";
    case "energy provider":
      return "/dashboard/energy-provider/marketplace";
    case "resident":
      return "/dashboard/resident/marketplace";
    default:
      return "/dashboard/marketplace";
  }
}

export function canCreateMarketplaceAds(role: string | null | undefined): boolean {
  return CREATOR_ROLES.has((role ?? "").toString().trim().toLowerCase());
}

export function isMarketplaceModuleEnabled(
  role: string | null | undefined,
  estateModules: string[],
): boolean {
  const normalized = (role ?? "").toString().trim().toLowerCase();
  // Platform creators are not estate-module gated.
  if (
    normalized === "super admin" ||
    normalized === "company" ||
    normalized === "energy provider"
  ) {
    return true;
  }
  if (!Array.isArray(estateModules) || estateModules.length === 0) return false;
  return estateModules.includes("marketplace");
}

export function isSettingsPath(pathname: string): boolean {
  return /\/settings(?:\/|$)/.test(pathname);
}

export function isMarketplacePath(pathname: string): boolean {
  return /\/marketplace(?:\/|$)/.test(pathname);
}

export function ensureHttpUrl(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
