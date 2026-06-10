/** Human-readable labels for `/api/v1/company-mgt/modules` keys. */
export const ESTATE_MODULE_LABELS: Record<string, string> = {
  bills: "Bills",
  rent: "Rent Management",
  meter: "Meter Management",
  marketplace: "Marketplace",
  visitor: "Visitor Management",
  complaints: "Complaints",
  announcements: "Announcements",
  wallet: "Wallet",
  transactions: "Transactions",
  comments: "Comments",
  address: "Address Management",
  expense: "Expenses",
  reporting: "Reporting",
  users: "User Management",
  chat: "Community Chat",
  company: "Company",
  asset: "Asset Management",
  "asset-category": "Asset Category",
  notifications: "Notifications",
  "operations-reporting": "Operations Reporting",
  "asset-maintenance": "Asset Maintenance",
  assets: "Asset Management",
};

/** Normalize module lists from estate list rows or `/estate-mgt/{id}/modules` API payloads. */
export function parseEstateModulesResponse(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is string => typeof item === "string");
  }
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) {
    return record.data.filter((item): item is string => typeof item === "string");
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const modules = (nested as Record<string, unknown>).modules;
    if (Array.isArray(modules)) {
      return modules.filter((item): item is string => typeof item === "string");
    }
  }

  if (Array.isArray(record.modules)) {
    return record.modules.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export function labelForEstateModule(key: string): string {
  return (
    ESTATE_MODULE_LABELS[key] ??
    key
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
