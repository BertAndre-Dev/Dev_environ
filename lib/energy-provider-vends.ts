export interface EnergyProviderVendRow {
  id?: string;
  _id?: string;
  createdAt?: string;
  amount?: number;
  meterNumber?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  commission?: number;
  commissionAmount?: number;
  estateCommission?: number;
  companyCommission?: number;
  providerPayout?: number;
  energyProviderPayout?: number;
  payout?: number;
  fullResponse?: {
    energyList?: Array<{
      price?: number;
      value?: number | string;
      taxRate?: number;
      tax_rate?: number;
    }>;
  };
}

export function formatVendCurrency(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `₦${value.toLocaleString()}`;
}

export function resolveVendCommission(row: EnergyProviderVendRow): number | null {
  const value =
    row.commission ??
    row.commissionAmount ??
    row.estateCommission ??
    row.companyCommission;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function resolveProviderPayout(row: EnergyProviderVendRow): number | null {
  const value = row.providerPayout ?? row.energyProviderPayout ?? row.payout;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatVendDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function vendResidentName(row: EnergyProviderVendRow): string {
  const user = row.user;
  if (!user) return "—";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "—";
}
