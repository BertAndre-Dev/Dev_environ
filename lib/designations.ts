export const DESIGNATIONS_PAGE_SIZE = 12;

export type Designation = {
  id: string;
  name: string;
  nameKey?: string;
  description: string;
  companyId?: string;
  estateId?: string;
  modules: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DesignationPagination = {
  total: number;
  page: number;
  pages: number;
  limit: number;
};

export type DesignationScope = "company" | "estate";

export function normalizeEntityId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const id = record._id ?? record.id;
    if (typeof id === "string") return id.trim();
    if (typeof id === "number" && Number.isFinite(id)) return String(id);
    return "";
  }
  return "";
}

function parseIsActive(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    return !(
      normalized === "false" ||
      normalized === "inactive" ||
      normalized === "0" ||
      normalized === "no"
    );
  }
  return Boolean(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function parseDesignation(raw: unknown): Designation | null {
  const record = asRecord(raw);
  if (!record) return null;

  const nested = asRecord(record.data);
  const source = nested ?? record;
  const id = normalizeEntityId(source.id ?? source._id);
  const name =
    typeof source.name === "string" ? source.name.trim() : "";
  if (!id && !name) return null;

  const description =
    typeof source.description === "string" ? source.description.trim() : "";
  const nameKey =
    typeof source.nameKey === "string" ? source.nameKey.trim() : undefined;
  const companyId = normalizeEntityId(source.companyId ?? source.company);
  const estateId = normalizeEntityId(source.estateId ?? source.estate);

  return {
    id: id || name,
    name,
    nameKey: nameKey || undefined,
    description,
    companyId: companyId || undefined,
    estateId: estateId || undefined,
    modules: parseStringList(source.modules),
    isActive: parseIsActive(source.isActive ?? source.active ?? source.status),
    createdAt:
      typeof source.createdAt === "string" ? source.createdAt : undefined,
    updatedAt:
      typeof source.updatedAt === "string" ? source.updatedAt : undefined,
  };
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (!record) return [];

  const nested = record.data;
  if (Array.isArray(nested)) return nested;

  const nestedRecord = asRecord(nested);
  if (nestedRecord) {
    for (const key of ["designations", "items", "docs", "results", "rows"]) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) return value;
    }
  }

  for (const key of ["designations", "items", "docs", "results", "rows"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

export function extractDesignations(payload: unknown): Designation[] {
  return extractArray(payload)
    .map(parseDesignation)
    .filter((item): item is Designation => Boolean(item?.id && item.name));
}

export function extractDesignation(payload: unknown): Designation | null {
  const fromList = extractDesignations(payload);
  if (fromList.length === 1) return fromList[0];

  const record = asRecord(payload);
  if (!record) return parseDesignation(payload);

  return parseDesignation(record.data ?? record);
}

export function extractDesignationPagination(
  payload: unknown,
  fallback: { page: number; limit: number; total: number },
): DesignationPagination {
  const record = asRecord(payload);
  const nested = asRecord(record?.data);
  const pagination = asRecord(record?.pagination) ?? asRecord(nested?.pagination);

  const page = Number(
    pagination?.page ?? pagination?.currentPage ?? fallback.page,
  );
  const limit = Number(
    pagination?.limit ?? pagination?.pageSize ?? fallback.limit,
  );
  const total = Number(
    pagination?.total ?? pagination?.count ?? fallback.total,
  );
  const pages = Number(
    pagination?.pages ??
      pagination?.totalPages ??
      Math.max(1, Math.ceil((total || 0) / (limit || fallback.limit || 1))),
  );

  return {
    total: Number.isFinite(total) ? total : fallback.total,
    page: Number.isFinite(page) && page > 0 ? page : fallback.page,
    pages: Number.isFinite(pages) && pages > 0 ? pages : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallback.limit,
  };
}

export function getDesignationScope(item: Designation): DesignationScope {
  return item.estateId ? "estate" : "company";
}

/** Company titles have a companyId and no estate (estateId is null/empty). */
export function isCompanyScopedDesignation(item: Designation): boolean {
  return Boolean(item.companyId) && !item.estateId;
}

export function isInheritedCompanyTitle(
  item: Designation,
  estateId: string,
): boolean {
  const ownEstateId = item.estateId ?? "";
  if (ownEstateId && ownEstateId === estateId) return false;
  return !ownEstateId && Boolean(item.companyId);
}

export function isStaffAssignmentDeleteError(message: string | undefined): boolean {
  if (!message) return false;
  return /staff|assigned|in use|cannot delete|deactivate/i.test(message);
}

export function userDesignationId(user: {
  designationId?: string | null;
  memberships?: Array<{
    designationId?: string | null;
    isCurrent?: boolean;
  }>;
}): string {
  const top = user.designationId?.trim();
  if (top) return top;
  const memberships = user.memberships ?? [];
  const current = memberships.find(
    (membership) => membership.isCurrent && membership.designationId?.trim(),
  );
  return (
    current?.designationId?.trim() ||
    memberships.find((membership) => membership.designationId?.trim())
      ?.designationId?.trim() ||
    ""
  );
}

export function designationNamesById(
  items: Designation[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items) {
    if (item.id) map[item.id] = item.name;
  }
  return map;
}

export function designationLabelForUser(
  user: {
    designationId?: string | null;
    memberships?: Array<{
      designationId?: string | null;
      isCurrent?: boolean;
    }>;
  },
  namesById: Record<string, string>,
): string {
  const id = userDesignationId(user);
  if (!id) return "—";
  return namesById[id]?.trim() || "—";
}

