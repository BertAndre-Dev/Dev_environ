export interface EnergyProviderConfigRow {
  id: string;
  estateId: string;
  estateName?: string;
  companyId?: string;
  energyProviderUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  commissionPercent: number;
  commissionRecipient?: string;
  isActive?: boolean;
  createdAt?: string;
}

type EnergyProviderUserRef =
  | string
  | {
      id?: string;
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  | null
  | undefined;

type RawEnergyProviderConfig = {
  id?: string;
  estateId?: string;
  companyId?: string;
  energyProviderUserId?: EnergyProviderUserRef;
  commissionPercent?: number;
  commissionRecipient?: string;
  isActive?: boolean;
  createdAt?: string;
};

function resolveEnergyProviderUser(userRef: EnergyProviderUserRef) {
  if (!userRef) {
    return { id: "", firstName: "", lastName: "", email: "" };
  }
  if (typeof userRef === "string") {
    return { id: userRef, firstName: "", lastName: "", email: "" };
  }
  return {
    id: userRef.id ?? userRef._id ?? "",
    firstName: userRef.firstName ?? "",
    lastName: userRef.lastName ?? "",
    email: userRef.email ?? "",
  };
}

/** Map GET /api/v1/energy-provider/config response to table rows. */
export function mapEnergyProviderConfigList(
  payload: unknown,
  estateName?: string,
): EnergyProviderConfigRow[] {
  if (!payload || typeof payload !== "object") return [];

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return data.flatMap((entry): EnergyProviderConfigRow[] => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as RawEnergyProviderConfig;
    const user = resolveEnergyProviderUser(row.energyProviderUserId);
    const id = row.id ?? "";
    if (!id) return [];

    return [
      {
        id,
        estateId: row.estateId ?? "",
        estateName,
        companyId: row.companyId,
        energyProviderUserId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        commissionPercent:
          typeof row.commissionPercent === "number" ? row.commissionPercent : 0,
        commissionRecipient: row.commissionRecipient,
        isActive: row.isActive,
        createdAt: row.createdAt,
      },
    ];
  });
}

export function formatEnergyProviderDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function energyProviderDisplayName(row: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): string {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return name || row.email || "—";
}

export function formatCommissionPercent(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value}%`;
}

export function formatCommissionRecipient(value?: string): string {
  if (!value) return "—";
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function paginateEnergyProviderRows<T extends { id: string }>(
  rows: T[],
  page: number,
  limit: number,
) {
  const total = rows.length;
  const pageSize = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    data: rows.slice(start, start + pageSize),
    pagination: {
      total,
      currentPage,
      totalPages,
      pageSize,
    },
  };
}

export function sortEnergyProviderConfigsByCreatedAt(
  rows: EnergyProviderConfigRow[],
): EnergyProviderConfigRow[] {
  return [...rows].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}
