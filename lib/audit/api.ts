import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";

export const AUDIT_ACTIVITIES = [
  ["all", "All"],
  ["authentication", "Authentication"],
  ["users", "Users"],
  ["estates", "Estates"],
  ["companies", "Companies"],
  ["meter", "Meters"],
  ["payment", "Payments"],
  ["bills", "Bills"],
  ["visitor", "Visitors"],
  ["request", "Requests"],
  ["communication", "Communication"],
  ["finance", "Finance"],
  ["asset", "Assets"],
  ["marketplace", "Marketplace"],
  ["operations", "Operations"],
  ["analytics", "Analytics"],
  ["other", "Other"],
] as const;

export const AUDIT_METHODS = ["all", "post", "patch", "put", "delete"] as const;
export const AUDIT_RESULTS = ["all", "true", "false"] as const;
export const DELETION_SOURCES = ["all", "user", "estate", "company"] as const;
export const DELETION_SELF = ["all", "true", "false"] as const;

export const AUDIT_PAGE_SIZES = [20, 50, 100] as const;

export type AuditActivity = (typeof AUDIT_ACTIVITIES)[number][0];
export type AuditMethod = (typeof AUDIT_METHODS)[number];
export type AuditResult = (typeof AUDIT_RESULTS)[number];
export type DeletionSource = (typeof DELETION_SOURCES)[number];
export type DeletionSelf = (typeof DELETION_SELF)[number];

export interface AuditFilterOption {
  id: string;
  label: string;
  count: number | null;
  companyId?: string;
}

export interface AuditPageInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditLogRow {
  id: string;
  createdAt: string;
  actorName: string;
  actorEmail: string;
  actorId: string;
  actorRole: string;
  action: string;
  module: string;
  activity: string;
  method: string;
  success: boolean | null;
  description: string;
  path: string;
  targetId: string;
  ip: string;
  device: string;
  estateName: string;
  estateId: string;
  companyName: string;
  companyId: string;
  statusCode: string;
  requestBody: unknown;
  query: unknown;
}

export interface UserDeletionRow {
  id: string;
  createdAt: string;
  deletedName: string;
  deletedEmail: string;
  deletedPhone: string;
  deletedUserId: string;
  deletedRole: string;
  deleterName: string;
  deleterEmail: string;
  deleterRole: string;
  deletedBy: string;
  selfDeleted: boolean | null;
  source: string;
  ip: string;
  device: string;
  estateName: string;
  companyName: string;
  snapshot: unknown;
}

export interface AuditListResult<T> {
  items: T[];
  pagination: AuditPageInfo;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  activity?: string;
  method?: string;
  success?: string;
  module?: string;
  action?: string;
  actorId?: string;
  targetId?: string;
  estateId?: string;
  companyId?: string;
}

export interface UserDeletionQuery {
  page: number;
  limit: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  source?: string;
  selfDeleted?: string;
  deletedUserId?: string;
  deletedBy?: string;
  estateId?: string;
  companyId?: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  ...Object.fromEntries(AUDIT_ACTIVITIES),
  meters: "Meters",
  payments: "Payments",
  visitors: "Visitors",
  requests: "Requests",
  assets: "Assets",
  finannce: "Finance",
  markeplace: "Marketplace",
  analytiics: "Analytics",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstString(record: Record<string, unknown> | null, keys: string[]): string {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function nestedRecord(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const value = asRecord(record[key]);
    if (value) return value;
  }
  return null;
}

function personName(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const record = asRecord(value);
  if (!record) return "";
  const direct = firstString(record, ["name", "fullName", "displayName"]);
  if (direct) return direct;
  return [firstString(record, ["firstName"]), firstString(record, ["lastName"])]
    .filter(Boolean)
    .join(" ");
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function readId(record: Record<string, unknown>, keys: string[]): string {
  const direct = firstString(record, keys);
  if (direct) return direct;
  for (const key of keys) {
    const nested = asRecord(record[key]);
    const id = firstString(nested, ["id", "_id"]);
    if (id) return id;
  }
  return "";
}

function readList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  const buckets = [root.data, root];
  for (const bucket of buckets) {
    if (Array.isArray(bucket)) return bucket;
    const record = asRecord(bucket);
    if (!record) continue;
    for (const key of [
      "items",
      "logs",
      "results",
      "records",
      "rows",
      "docs",
      "activities",
      "estates",
      "deletions",
    ]) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return [];
}

function readPagination(
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
  itemCount: number,
): AuditPageInfo {
  const root = asRecord(payload) ?? {};
  const pageInfo =
    asRecord(root.pagination) ??
    asRecord(root.meta) ??
    asRecord(asRecord(root.data)?.pagination) ??
    {};
  const total =
    readNumber(pageInfo.total ?? pageInfo.totalCount ?? root.total) ?? itemCount;
  const page =
    readNumber(pageInfo.page ?? pageInfo.currentPage ?? pageInfo.current) ??
    fallbackPage;
  const limit =
    readNumber(pageInfo.limit ?? pageInfo.pageSize ?? pageInfo.perPage) ??
    fallbackLimit;
  const pages =
    readNumber(pageInfo.pages ?? pageInfo.totalPages ?? pageInfo.pageCount) ??
    Math.max(1, Math.ceil(Math.max(total, 1) / Math.max(limit, 1)));
  return { total, page, limit, pages };
}

function assertSuccess(payload: unknown) {
  const root = asRecord(payload);
  if (root?.success === false) {
    throw new Error(getApiErrorMessage(payload) ?? "Request failed");
  }
}

function compactParams(
  entries: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value == null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed === "all") continue;
      params[key] = trimmed;
      continue;
    }
    params[key] = value;
  }
  return params;
}

function activityLabel(key: string, fallback?: string): string {
  const known = ACTIVITY_LABELS[key] ?? ACTIVITY_LABELS[key.toLowerCase()];
  const provided = fallback?.trim();
  if (provided && provided.toLowerCase() !== key.toLowerCase()) return provided;
  if (known) return known;
  if (provided) return provided;
  return key.replaceAll("-", " ");
}

export function formatActivity(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  return activityLabel(trimmed);
}

function readFilterOptions(
  payload: unknown,
  kind: "activity" | "estate",
): AuditFilterOption[] {
  const list = readList(payload);
  const fromList = list
    .map((item): AuditFilterOption | null => {
      const record = asRecord(item);
      if (!record) return null;
      const id =
        kind === "estate"
          ? readId(record, ["id", "_id", "estateId", "key", "value"])
          : firstString(record, ["key", "id", "value", "activity", "slug"]);
      if (!id) return null;
      const label =
        kind === "estate"
          ? firstString(record, ["label", "name", "estateName", "title"]) ||
            (id.toLowerCase() === "all" ? "All estates" : id)
          : activityLabel(
              id,
              firstString(record, ["label", "name", "title"]),
            );
      const companyId = readId(record, ["companyId", "company"]);
      return {
        id,
        label,
        count: readNumber(
          record.count ?? record.total ?? record.entries ?? record.entryCount,
        ),
        companyId: companyId || undefined,
      };
    })
    .filter((item): item is AuditFilterOption => item != null);

  if (fromList.length > 0) return moveAllFirst(fromList);

  const data = asRecord(asRecord(payload)?.data) ?? asRecord(payload);
  if (!data) return [];
  const fromMap = Object.entries(data)
    .map(([key, value]) => {
      if (typeof value === "number") {
        return { id: key, label: activityLabel(key), count: value };
      }
      const record = asRecord(value);
      if (!record) return null;
      const count = readNumber(record.count ?? record.total ?? record.entries);
      if (count == null && !firstString(record, ["label", "name"])) return null;
      return {
        id: firstString(record, ["key", "id"]) || key,
        label: activityLabel(key, firstString(record, ["label", "name"])),
        count,
      } satisfies AuditFilterOption;
    })
    .filter((item): item is AuditFilterOption => Boolean(item));

  return moveAllFirst(fromMap);
}

function moveAllFirst(options: AuditFilterOption[]): AuditFilterOption[] {
  const all = options.find((option) => option.id.toLowerCase() === "all");
  const rest = options.filter((option) => option.id.toLowerCase() !== "all");
  return all ? [all, ...rest] : options;
}

function withAllFallback(
  options: AuditFilterOption[],
  fallback: AuditFilterOption[],
): AuditFilterOption[] {
  if (options.length === 0) return fallback;
  if (options.some((option) => option.id.toLowerCase() === "all")) return options;
  return [fallback[0], ...options];
}

function readSuccess(record: Record<string, unknown>): boolean | null {
  const direct = readBoolean(record.success ?? record.ok ?? record.result);
  if (direct != null) return direct;
  const code = readNumber(record.statusCode ?? record.status);
  if (code == null) return null;
  return code < 400;
}

function readJson(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const nested = asRecord(value);
    if (nested && Object.keys(nested).length === 0) continue;
    return value;
  }
  return null;
}

export function normalizeAuditLog(value: unknown): AuditLogRow | null {
  const record = asRecord(value);
  if (!record) return null;
  const actor = nestedRecord(record, ["actor", "performedBy", "createdBy", "user"]);
  const estate = nestedRecord(record, ["estate"]);
  const company = nestedRecord(record, ["company"]);
  const action = firstString(record, ["action"]);
  const path = firstString(record, ["path", "url", "endpoint"]);
  const description =
    firstString(record, ["description", "message", "summary"]) || action || path;
  const id = readId(record, ["id", "_id"]);
  return {
    id,
    createdAt: firstString(record, ["createdAt", "timestamp", "occurredAt", "date"]),
    actorName:
      firstString(record, ["actorName", "performedByName"]) || personName(actor),
    actorEmail: firstString(record, ["actorEmail"]) || firstString(actor, ["email"]),
    actorId: readId(record, ["actorId"]) || firstString(actor, ["id", "_id"]),
    actorRole: firstString(record, ["actorRole"]) || firstString(actor, ["role"]),
    action,
    module: firstString(record, ["module"]),
    activity: firstString(record, ["activity"]),
    method: firstString(record, ["method"]).toUpperCase(),
    success: readSuccess(record),
    description,
    path,
    targetId: readId(record, ["targetId", "target"]),
    ip: firstString(record, ["ip", "ipAddress", "requestIp", "remoteAddress"]),
    device: firstString(record, ["device", "userAgent", "user_agent"]),
    estateName: firstString(record, ["estateName"]) || firstString(estate, ["name"]),
    estateId: readId(record, ["estateId"]) || firstString(estate, ["id", "_id"]),
    companyName:
      firstString(record, ["companyName"]) || firstString(company, ["name"]),
    companyId: readId(record, ["companyId"]) || firstString(company, ["id", "_id"]),
    statusCode: firstString(record, ["statusCode", "status"]),
    requestBody: readJson(record, [
      "requestBody",
      "sanitizedRequestBody",
      "sanitizedBody",
      "body",
    ]),
    query: readJson(record, ["query", "requestQuery", "queryParams"]),
  };
}

export function normalizeUserDeletion(value: unknown): UserDeletionRow | null {
  const record = asRecord(value);
  if (!record) return null;
  const deleted =
    nestedRecord(record, ["deletedUser", "user", "account"]) ??
    nestedRecord(record, ["snapshot", "userSnapshot"]);
  const deleter = nestedRecord(record, ["deletedByUser", "deleter", "performedBy"]);
  const estate = nestedRecord(record, ["estate"]);
  const company = nestedRecord(record, ["company"]);
  const snapshot = readJson(record, ["snapshot", "userSnapshot", "userDocument"]);
  return {
    id: readId(record, ["id", "_id"]),
    createdAt: firstString(record, ["createdAt", "timestamp", "deletedAt", "date"]),
    deletedName:
      firstString(record, ["deletedUserName", "userName", "name"]) ||
      personName(deleted),
    deletedEmail:
      firstString(record, ["deletedUserEmail", "email"]) ||
      firstString(deleted, ["email"]),
    deletedPhone:
      firstString(record, ["deletedUserPhone", "phone", "phoneNumber"]) ||
      firstString(deleted, ["phone", "phoneNumber", "mobile"]),
    deletedUserId:
      readId(record, ["deletedUserId"]) || firstString(deleted, ["id", "_id"]),
    deletedRole:
      firstString(record, ["deletedUserRole"]) || firstString(deleted, ["role"]),
    deleterName:
      firstString(record, ["deletedByName", "deleterName"]) || personName(deleter),
    deleterEmail:
      firstString(record, ["deletedByEmail"]) || firstString(deleter, ["email"]),
    deleterRole:
      firstString(record, ["deletedByRole", "deleterRole"]) ||
      firstString(deleter, ["role"]),
    deletedBy: readId(record, ["deletedBy"]) || firstString(deleter, ["id", "_id"]),
    selfDeleted: readBoolean(record.selfDeleted ?? record.isSelfDeleted),
    source: firstString(record, ["source"]),
    ip: firstString(record, ["ip", "ipAddress", "requestIp", "remoteAddress"]),
    device: firstString(record, ["device", "userAgent", "user_agent"]),
    estateName: firstString(record, ["estateName"]) || firstString(estate, ["name"]),
    companyName:
      firstString(record, ["companyName"]) || firstString(company, ["name"]),
    snapshot,
  };
}

function mergeDefined<T extends object>(base: T, extra: T): T {
  const next = { ...base };
  for (const [key, value] of Object.entries(extra) as [keyof T, T[keyof T]][]) {
    if (value == null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    next[key] = value;
  }
  return next;
}

export function mergeAuditLog(base: AuditLogRow, extra: AuditLogRow): AuditLogRow {
  return mergeDefined(base, extra);
}

export function mergeUserDeletion(
  base: UserDeletionRow,
  extra: UserDeletionRow,
): UserDeletionRow {
  return mergeDefined(base, extra);
}

export function formatAuditError(error: unknown, fallback: string): string {
  return getApiErrorMessage(error) ?? fallback;
}

export function formatJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    const text = JSON.stringify(value, null, 2);
    return text === "{}" || text === "[]" ? null : text;
  } catch {
    return null;
  }
}

export async function listAuditEstates(): Promise<AuditFilterOption[]> {
  const res = await axiosInstance.get("/api/v1/audit/estates");
  assertSuccess(res.data);
  return withAllFallback(readFilterOptions(res.data, "estate"), [
    { id: "all", label: "All estates", count: null },
  ]);
}

export async function listAuditActivities(query: {
  estateId?: string;
  companyId?: string;
}): Promise<AuditFilterOption[]> {
  const res = await axiosInstance.get("/api/v1/audit/logs/activities", {
    params: compactParams({
      estateId: query.estateId,
      companyId: query.companyId,
    }),
  });
  assertSuccess(res.data);
  const fallback = AUDIT_ACTIVITIES.map(([id, label]) => ({
    id,
    label,
    count: null,
  }));
  const options = readFilterOptions(res.data, "activity").map((option) => ({
    ...option,
    label: activityLabel(option.id, option.label),
  }));
  return withAllFallback(options, fallback);
}

export async function listAuditLogs(
  query: AuditLogQuery,
): Promise<AuditListResult<AuditLogRow>> {
  const res = await axiosInstance.get("/api/v1/audit/logs", {
    params: compactParams({
      page: query.page,
      limit: query.limit,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      activity: query.activity,
      method: query.method,
      success: query.success,
      module: query.module,
      action: query.action,
      actorId: query.actorId,
      targetId: query.targetId,
      estateId: query.estateId,
      companyId: query.companyId,
    }),
  });
  assertSuccess(res.data);
  const items = readList(res.data)
    .map(normalizeAuditLog)
    .filter((item): item is AuditLogRow => Boolean(item));
  return {
    items,
    pagination: readPagination(res.data, query.page, query.limit, items.length),
  };
}

export async function getAuditLog(id: string): Promise<AuditLogRow> {
  const res = await axiosInstance.get(`/api/v1/audit/logs/${id}`);
  assertSuccess(res.data);
  const entity = asRecord(res.data)?.data ?? res.data;
  const row = normalizeAuditLog(entity);
  if (!row) throw new Error("Audit entry could not be read");
  return row;
}

export async function listUserDeletions(
  query: UserDeletionQuery,
): Promise<AuditListResult<UserDeletionRow>> {
  const res = await axiosInstance.get("/api/v1/audit/user-deletions", {
    params: compactParams({
      page: query.page,
      limit: query.limit,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      source: query.source,
      selfDeleted: query.selfDeleted,
      deletedUserId: query.deletedUserId,
      deletedBy: query.deletedBy,
      estateId: query.estateId,
      companyId: query.companyId,
    }),
  });
  assertSuccess(res.data);
  const items = readList(res.data)
    .map(normalizeUserDeletion)
    .filter((item): item is UserDeletionRow => Boolean(item));
  return {
    items,
    pagination: readPagination(res.data, query.page, query.limit, items.length),
  };
}

export async function getUserDeletion(id: string): Promise<UserDeletionRow> {
  const res = await axiosInstance.get(`/api/v1/audit/user-deletions/${id}`);
  assertSuccess(res.data);
  const entity = asRecord(res.data)?.data ?? res.data;
  const row = normalizeUserDeletion(entity);
  if (!row) throw new Error("Deletion entry could not be read");
  return row;
}

export async function listAuditCompanies(): Promise<AuditFilterOption[]> {
  const collected: AuditFilterOption[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= 5) {
    const res = await axiosInstance.get("/api/v1/company-mgt", {
      params: { page, limit: 100 },
    });
    assertSuccess(res.data);
    const batch = readList(res.data)
      .map((item): AuditFilterOption | null => {
        const record = asRecord(item);
        if (!record) return null;
        const id = readId(record, ["id", "_id"]);
        const label = firstString(record, ["name"]);
        if (!id || !label) return null;
        return { id, label, count: null };
      })
      .filter((item): item is AuditFilterOption => item != null);
    collected.push(...batch);
    pages = readPagination(res.data, page, 100, batch.length).pages;
    page += 1;
  }
  return collected;
}
