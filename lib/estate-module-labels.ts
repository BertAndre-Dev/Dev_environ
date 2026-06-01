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

export function labelForEstateModule(key: string): string {
  return (
    ESTATE_MODULE_LABELS[key] ??
    key
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}
