"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";

import { AuditDetailSheet, type AuditDetailModel } from "@/components/audit/AuditDetailSheet";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import Pagination from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format-date";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import {
  AUDIT_ACTIVITIES,
  AUDIT_METHODS,
  AUDIT_PAGE_SIZES,
  AUDIT_RESULTS,
  DELETION_SELF,
  DELETION_SOURCES,
  formatActivity,
  formatAuditError,
  formatJson,
  getAuditLog,
  getUserDeletion,
  listAuditActivities,
  listAuditCompanies,
  listAuditEstates,
  listAuditLogs,
  listUserDeletions,
  mergeAuditLog,
  mergeUserDeletion,
  type AuditFilterOption,
  type AuditLogRow,
  type AuditPageInfo,
  type UserDeletionRow,
} from "@/lib/audit/api";

type AuditTab = "activity" | "deletions";

const EMPTY_PAGE: AuditPageInfo = { total: 0, page: 1, limit: 20, pages: 1 };

const controlClass =
  "h-11 w-full cursor-pointer rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

function scopeCopy(role: string): string {
  if (role === "super admin") return "Every company and estate. Newest first.";
  if (role === "company") {
    return "Your company and every estate attached to it. Newest first.";
  }
  if (role === "estate admin" || role === "admin") {
    return "The estate you manage. Newest first.";
  }
  return "Activity in your scope. Newest first.";
}

function resultLabel(success: boolean | null): string {
  if (success === true) return "Succeeded";
  if (success === false) return "Failed";
  return "Unknown";
}

function sourceLabel(source: string): string {
  if (!source) return "—";
  if (source === "user") return "User";
  if (source === "estate") return "Estate";
  if (source === "company") return "Company";
  return source;
}

function selfLabel(value: boolean | null): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function display(value: string): string {
  return value.trim() ? value : "—";
}

function activityTitle(row: AuditLogRow): string {
  return row.description || row.action || row.path || "Activity";
}

function deletionTitle(row: UserDeletionRow): string {
  return row.deletedName || row.deletedEmail || "Deleted account";
}

function linkedNames(
  ids: string[],
  explicitName: string,
  options: AuditFilterOption[],
): string {
  if (explicitName.trim()) return explicitName.trim();
  return ids
    .map((id) => options.find((option) => option.id === id)?.label || id)
    .filter(Boolean)
    .join(", ");
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "";
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  return `${seconds >= 10 ? Math.round(seconds) : seconds.toFixed(1)} s`;
}

function toActivityDetail(
  row: AuditLogRow,
  estates: AuditFilterOption[],
  companies: AuditFilterOption[],
): AuditDetailModel {
  const blocks = [
    row.params ? { title: "Path params", value: formatJson(row.params) } : null,
    row.requestBody ? { title: "Request body", value: formatJson(row.requestBody) } : null,
    row.query ? { title: "Query", value: formatJson(row.query) } : null,
  ].filter((block): block is { title: string; value: string } => Boolean(block?.value));

  return {
    title: activityTitle(row),
    subtitle: [row.actorName, row.actorEmail].filter(Boolean).join(" · "),
    badge: {
      label: resultLabel(row.success),
      tone: row.success === false ? "bad" : row.success === true ? "ok" : "neutral",
    },
    fields: [
      { label: "When", value: formatDateTime(row.createdAt) },
      { label: "Actor", value: display(row.actorName) },
      { label: "Email", value: display(row.actorEmail) },
      { label: "Role", value: display(row.actorRole) },
      { label: "Actor id", value: display(row.actorId) },
      { label: "Activity", value: display(row.activityLabel || formatActivity(row.activity)) },
      { label: "Module", value: display(row.module) },
      { label: "Action", value: display(row.action) },
      { label: "Method", value: display(row.method) },
      { label: "Route", value: display(row.route) },
      { label: "Path", value: display(row.path) },
      { label: "Target", value: display(row.targetId) },
      { label: "Status", value: display(row.statusCode) },
      { label: "Duration", value: display(formatDuration(row.durationMs)) },
      { label: "Error", value: display(row.errorMessage) },
      { label: "Company", value: display(linkedNames(row.companyIds, row.companyName, companies)) },
      { label: "Estate", value: display(linkedNames(row.estateIds, row.estateName, estates)) },
      { label: "IP", value: display(row.ip) },
      { label: "Device", value: display(row.device) },
    ].filter((field) => field.value !== "—"),
    blocks,
  };
}

function toDeletionDetail(row: UserDeletionRow): AuditDetailModel {
  const snapshot = formatJson(row.snapshot);
  return {
    title: deletionTitle(row),
    subtitle: row.deletedEmail,
    badge: {
      label: row.selfDeleted ? "Self-deleted" : sourceLabel(row.source),
      tone: "neutral",
    },
    fields: [
      { label: "When", value: formatDateTime(row.createdAt) },
      { label: "Deleted user", value: display(row.deletedName) },
      { label: "Email", value: display(row.deletedEmail) },
      { label: "Phone", value: display(row.deletedPhone) },
      { label: "Role", value: display(row.deletedRole) },
      { label: "User id", value: display(row.deletedUserId) },
      { label: "Deleted by", value: display(row.deleterName) },
      { label: "Deleter email", value: display(row.deleterEmail) },
      { label: "Deleter role", value: display(row.deleterRole) },
      { label: "Deleter id", value: display(row.deletedBy) },
      { label: "Self-deleted", value: selfLabel(row.selfDeleted) },
      { label: "Source", value: sourceLabel(row.source) },
      { label: "Company", value: display(row.companyName) },
      { label: "Estate", value: display(row.estateName) },
      { label: "IP", value: display(row.ip) },
      { label: "Device", value: display(row.device) },
    ],
    blocks: snapshot ? [{ title: "Account snapshot", value: snapshot }] : [],
  };
}

export default function AuditTrailPage() {
  const role = useSelector(selectUserRole);
  const isSuperAdmin = role === "super admin";
  const reduceMotion = useReducedMotion();

  const [tab, setTab] = useState<AuditTab>("activity");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(20);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estateId, setEstateId] = useState("all");
  const [companyId, setCompanyId] = useState("");
  const [activity, setActivity] = useState("all");
  const [method, setMethod] = useState("all");
  const [success, setSuccess] = useState("all");
  const [moduleName, setModuleName] = useState("");
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [source, setSource] = useState("all");
  const [selfDeleted, setSelfDeleted] = useState("all");
  const [deletedUserId, setDeletedUserId] = useState("");
  const [deletedBy, setDeletedBy] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [estates, setEstates] = useState<AuditFilterOption[]>([
    { id: "all", label: "All estates", count: null },
  ]);
  const [activities, setActivities] = useState<AuditFilterOption[]>([]);
  const [companies, setCompanies] = useState<AuditFilterOption[]>([]);

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [deletions, setDeletions] = useState<UserDeletionRow[]>([]);
  const [pagination, setPagination] = useState<AuditPageInfo>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedDeletionId, setSelectedDeletionId] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<AuditLogRow | null>(null);
  const [detailDeletion, setDetailDeletion] = useState<UserDeletionRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const textQuery = useMemo(
    () => ({
      search: search.trim(),
      moduleName: moduleName.trim(),
      action: action.trim(),
      actorId: actorId.trim(),
      targetId: targetId.trim(),
      deletedUserId: deletedUserId.trim(),
      deletedBy: deletedBy.trim(),
    }),
    [action, actorId, deletedBy, deletedUserId, moduleName, search, targetId],
  );
  const [debouncedText, setDebouncedText] = useState(textQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedText((current) =>
        JSON.stringify(current) === JSON.stringify(textQuery) ? current : textQuery,
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [textQuery]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        tab,
        limit,
        debouncedText,
        startDate,
        endDate,
        estateId,
        companyId,
        activity,
        method,
        success,
        source,
        selfDeleted,
      }),
    [
      tab,
      limit,
      debouncedText,
      startDate,
      endDate,
      estateId,
      companyId,
      activity,
      method,
      success,
      source,
      selfDeleted,
    ],
  );

  const [trackedKey, setTrackedKey] = useState(filterKey);
  if (trackedKey !== filterKey) {
    setTrackedKey(filterKey);
    if (page !== 1) setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    listAuditEstates()
      .then((options) => {
        if (!cancelled) setEstates(options);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(formatAuditError(err, "Couldn't load estates"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    listAuditCompanies()
      .then((options) => {
        if (!cancelled) setCompanies(options);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(formatAuditError(err, "Couldn't load companies"));
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    listAuditActivities({
      estateId,
      companyId: isSuperAdmin ? companyId : undefined,
    })
      .then((options) => {
        if (!cancelled) setActivities(options);
      })
      .catch(() => {
        if (!cancelled) {
          setActivities(
            AUDIT_ACTIVITIES.map(([id, label]) => ({
              id,
              label,
              count: null,
            })),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [estateId, companyId, isSuperAdmin]);

  const visibleEstates = useMemo(() => {
    const estatesHaveCompany = estates.some(
      (estate) => estate.id.toLowerCase() !== "all" && estate.companyId,
    );
    if (!companyId || !estatesHaveCompany) return estates;
    return estates.filter(
      (estate) =>
        estate.id.toLowerCase() === "all" || estate.companyId === companyId,
    );
  }, [companyId, estates]);

  useEffect(() => {
    if (visibleEstates.some((estate) => estate.id === estateId)) return;
    setEstateId("all");
  }, [estateId, visibleEstates]);

  useEffect(() => {
    if (activities.length === 0) return;
    if (activities.some((item) => item.id === activity)) return;
    setActivity("all");
    setModuleName("");
    setAction("");
  }, [activities, activity]);

  const activityScope = useMemo(
    () =>
      activity === "all"
        ? activities
        : activities.filter((item) => item.id === activity),
    [activities, activity],
  );
  const moduleChoices = useMemo(
    () =>
      [...new Set(activityScope.flatMap((item) => item.modules ?? []))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [activityScope],
  );
  const actionChoices = useMemo(
    () =>
      [...new Set(activityScope.flatMap((item) => item.actions ?? []))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [activityScope],
  );

  useEffect(() => {
    if (moduleChoices.length === 0 || !moduleName) return;
    if (!moduleChoices.includes(moduleName)) setModuleName("");
  }, [moduleChoices, moduleName]);

  useEffect(() => {
    if (actionChoices.length === 0 || !action) return;
    if (!actionChoices.includes(action)) setAction("");
  }, [actionChoices, action]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const request =
      tab === "activity"
        ? listAuditLogs({
            page,
            limit,
            search: debouncedText.search,
            startDate,
            endDate,
            activity,
            method,
            success,
            module: debouncedText.moduleName,
            action: debouncedText.action,
            actorId: debouncedText.actorId,
            targetId: debouncedText.targetId,
            estateId,
            companyId: isSuperAdmin ? companyId : undefined,
          })
        : listUserDeletions({
            page,
            limit,
            search: debouncedText.search,
            startDate,
            endDate,
            source,
            selfDeleted,
            deletedUserId: debouncedText.deletedUserId,
            deletedBy: debouncedText.deletedBy,
            estateId,
            companyId: isSuperAdmin ? companyId : undefined,
          });

    request
      .then((result) => {
        if (cancelled) return;
        if (tab === "activity") setLogs(result.items as AuditLogRow[]);
        else setDeletions(result.items as UserDeletionRow[]);
        setPagination(result.pagination);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = formatAuditError(err, "Couldn't load the audit trail");
        setError(message);
        toast.error(message);
        if (tab === "activity") setLogs([]);
        else setDeletions([]);
        setPagination({ ...EMPTY_PAGE, limit });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    tab,
    page,
    limit,
    debouncedText,
    startDate,
    endDate,
    activity,
    method,
    success,
    source,
    selfDeleted,
    estateId,
    companyId,
    isSuperAdmin,
    reloadToken,
  ]);

  const closeDetail = useCallback(() => {
    setSelectedLogId(null);
    setSelectedDeletionId(null);
    setDetailError(null);
  }, []);

  useEffect(() => {
    if (!selectedLogId) {
      setDetailLog(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    getAuditLog(selectedLogId)
      .then((row) => {
        if (!cancelled) setDetailLog({ ...row, id: row.id || selectedLogId });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetailError(formatAuditError(err, "Couldn't open this entry"));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLogId]);

  useEffect(() => {
    if (!selectedDeletionId) {
      setDetailDeletion(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    getUserDeletion(selectedDeletionId)
      .then((row) => {
        if (!cancelled) {
          setDetailDeletion({ ...row, id: row.id || selectedDeletionId });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetailError(formatAuditError(err, "Couldn't open this deletion"));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDeletionId]);

  const selectedLog = logs.find((row) => row.id === selectedLogId) ?? null;
  const selectedDeletion =
    deletions.find((row) => row.id === selectedDeletionId) ?? null;
  const matchingDetailLog =
    selectedLogId && detailLog?.id === selectedLogId ? detailLog : null;
  const matchingDetailDeletion =
    selectedDeletionId && detailDeletion?.id === selectedDeletionId
      ? detailDeletion
      : null;
  const shownLog = selectedLogId
    ? selectedLog && matchingDetailLog
      ? mergeAuditLog(selectedLog, matchingDetailLog)
      : selectedLog ?? matchingDetailLog
    : null;
  const shownDeletion = selectedDeletionId
    ? selectedDeletion && matchingDetailDeletion
      ? mergeUserDeletion(selectedDeletion, matchingDetailDeletion)
      : selectedDeletion ?? matchingDetailDeletion
    : null;

  const detailModel = shownLog
    ? toActivityDetail(shownLog, estates, companies)
    : shownDeletion
      ? toDeletionDetail(shownDeletion)
      : null;
  const sheetOpen = Boolean(selectedLogId || selectedDeletionId);

  const filtersActive = Boolean(
    search.trim() ||
      startDate ||
      endDate ||
      (estateId && estateId !== "all") ||
      companyId ||
      (tab === "activity" &&
        (activity !== "all" ||
          method !== "all" ||
          success !== "all" ||
          moduleName ||
          action ||
          actorId ||
          targetId)) ||
      (tab === "deletions" &&
        (source !== "all" || selfDeleted !== "all" || deletedUserId || deletedBy)),
  );

  const clearFilters = () => {
    setSearch("");
    setDebouncedText({
      search: "",
      moduleName: "",
      action: "",
      actorId: "",
      targetId: "",
      deletedUserId: "",
      deletedBy: "",
    });
    setStartDate("");
    setEndDate("");
    setEstateId("all");
    setCompanyId("");
    setActivity("all");
    setMethod("all");
    setSuccess("all");
    setModuleName("");
    setAction("");
    setActorId("");
    setTargetId("");
    setSource("all");
    setSelfDeleted("all");
    setDeletedUserId("");
    setDeletedBy("");
  };

  const rows = tab === "activity" ? logs : deletions;
  const showSkeleton = loading && rows.length === 0 && !error;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em]">
            Audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{scopeCopy(role)}</p>
        </div>
        <div
          className="relative inline-flex rounded-xl bg-muted p-1"
          role="tablist"
          aria-label="Audit views"
        >
          {(
            [
              ["activity", "Activity"],
              ["deletions", "Deleted accounts"],
            ] as const
          ).map(([value, label]) => {
            const selected = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setTab(value);
                  closeDetail();
                }}
                className={`relative cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100 ${
                  selected ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {selected ? (
                  <motion.span
                    layoutId={reduceMotion ? undefined : "audit-tab"}
                    className="absolute inset-0 rounded-lg bg-background shadow-sm"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", bounce: 0, duration: 0.35 }
                    }
                  />
                ) : null}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="sticky top-20 z-20 rounded-2xl border border-white/60 bg-background/70 p-4 shadow-sm backdrop-blur-xl backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-background [@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
              Search
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  tab === "activity"
                    ? "Name, email, description, or path"
                    : "Name, email, or phone"
                }
                className={`${controlClass} cursor-text pl-9`}
              />
            </span>
          </label>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
              From
            </span>
            <IsoLinkedRangeStart
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              ariaLabel="Start date"
              placeholder="Start date"
              className="h-11"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
              To
            </span>
            <IsoLinkedRangeEnd
              startDate={startDate}
              endDate={endDate}
              onEndChange={setEndDate}
              ariaLabel="End date"
              placeholder="End date"
              className="h-11"
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
              Estate
            </span>
            <select
              className={controlClass}
              value={estateId}
              onChange={(event) => setEstateId(event.target.value)}
            >
              {visibleEstates.map((estate) => (
                <option key={estate.id} value={estate.id}>
                  {estate.label}
                  {estate.count != null ? ` (${estate.count})` : ""}
                </option>
              ))}
            </select>
          </label>
          {isSuperAdmin ? (
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
                Company
              </span>
              <select
                className={controlClass}
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {tab === "activity" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
                  Method
                </span>
                <select
                  className={controlClass}
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                >
                  {AUDIT_METHODS.map((value) => (
                    <option key={value} value={value}>
                      {value === "all" ? "Any method" : value.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
                  Result
                </span>
                <select
                  className={controlClass}
                  value={success}
                  onChange={(event) => setSuccess(event.target.value)}
                >
                  {AUDIT_RESULTS.map((value) => (
                    <option key={value} value={value}>
                      {value === "all"
                        ? "Any result"
                        : value === "true"
                          ? "Succeeded"
                          : "Failed"}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
                  Source
                </span>
                <select
                  className={controlClass}
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                >
                  {DELETION_SOURCES.map((value) => (
                    <option key={value} value={value}>
                      {value === "all" ? "Any source" : sourceLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
                  Self-deleted
                </span>
                <select
                  className={controlClass}
                  value={selfDeleted}
                  onChange={(event) => setSelfDeleted(event.target.value)}
                >
                  {DELETION_SELF.map((value) => (
                    <option key={value} value={value}>
                      {value === "all"
                        ? "Anyone"
                        : value === "true"
                          ? "Self-deleted"
                          : "Deleted by someone else"}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        {tab === "activity" && activities.length > 0 ? (
          <div
            className="mt-4 flex gap-2 overflow-x-auto overscroll-x-contain pb-1"
            role="radiogroup"
            aria-label="Activity"
          >
            {activities.map((item) => {
              const selected = activity === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setActivity(item.id);
                    setModuleName("");
                    setAction("");
                  }}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100 ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count != null ? (
                    <span
                      className={`rounded-full px-1.5 text-xs tabular-nums ${
                        selected ? "bg-white/20" : "bg-background"
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className="cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-primary transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100"
            aria-expanded={moreOpen}
          >
            {moreOpen ? "Hide extra filters" : "More filters"}
          </button>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer rounded-md px-2 py-1 text-sm text-muted-foreground transition-transform duration-100 ease-out hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100"
            >
              Clear filters
            </button>
          ) : null}
          {loading && rows.length > 0 ? (
            <span className="text-sm text-muted-foreground" role="status">
              Updating…
            </span>
          ) : null}
        </div>

        {moreOpen ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {tab === "activity" ? (
              <>
                {moduleChoices.length > 0 ? (
                  <FilterSelect
                    label="Module"
                    value={moduleName}
                    onChange={setModuleName}
                    emptyLabel="Any module"
                    options={moduleChoices}
                  />
                ) : (
                  <FilterField label="Module" value={moduleName} onChange={setModuleName} placeholder="user-mgt" />
                )}
                {actionChoices.length > 0 ? (
                  <FilterSelect
                    label="Action"
                    value={action}
                    onChange={setAction}
                    emptyLabel="Any action"
                    options={actionChoices}
                  />
                ) : (
                  <FilterField label="Action" value={action} onChange={setAction} placeholder="UserMgtController.deleteUser" />
                )}
                <FilterField label="Actor id" value={actorId} onChange={setActorId} placeholder="User id" />
                <FilterField label="Target id" value={targetId} onChange={setTargetId} placeholder="Record id" />
              </>
            ) : (
              <>
                <FilterField label="Deleted user id" value={deletedUserId} onChange={setDeletedUserId} placeholder="User id" />
                <FilterField label="Deleted by" value={deletedBy} onChange={setDeletedBy} placeholder="Deleter user id" />
              </>
            )}
          </div>
        ) : null}
      </section>

      <section
        className={`overflow-hidden rounded-2xl border border-border bg-background ${
          loading && rows.length > 0 ? "opacity-80" : ""
        }`}
        aria-busy={loading}
      >
        {showSkeleton ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="px-4 py-4">
                <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error && rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => setReloadToken((current) => current + 1)}
              className="mt-3 cursor-pointer text-sm font-medium text-primary"
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium">
              {tab === "activity" ? "No activity in this view" : "No deleted accounts in this view"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtersActive
                ? "Clear a filter or widen the dates."
                : "New entries will show up here."}
            </p>
          </div>
        ) : tab === "activity" ? (
          <ul className="divide-y divide-border">
            {logs.map((row, index) => {
              const selected = row.id !== "" && row.id === selectedLogId;
              return (
                <li key={row.id || `${row.createdAt}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeletionId(null);
                      setSelectedLogId(row.id || null);
                    }}
                    disabled={!row.id}
                    className={`grid w-full cursor-pointer gap-1 px-4 py-3 text-left transition-colors duration-100 ease-out active:bg-muted disabled:cursor-default sm:grid-cols-[10.5rem_minmax(0,0.9fr)_minmax(0,1.3fr)_auto] sm:items-center sm:gap-4 ${
                      selected ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {row.actorName || row.actorEmail || "Unknown actor"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.actorEmail || row.actorRole || "—"}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{activityTitle(row)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[
                          row.activityLabel || formatActivity(row.activity),
                          row.module,
                          linkedNames(row.estateIds, row.estateName, estates) ||
                            linkedNames(row.companyIds, row.companyName, companies),
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="flex flex-col items-start gap-1 sm:items-end">
                      <span className="flex items-center gap-2">
                        {row.method ? (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                            {row.method}
                          </span>
                        ) : null}
                        <ResultPill success={row.success} />
                      </span>
                      {row.ip ? (
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {row.ip}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="divide-y divide-border">
            {deletions.map((row, index) => {
              const selected = row.id !== "" && row.id === selectedDeletionId;
              return (
                <li key={row.id || `${row.createdAt}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogId(null);
                      setSelectedDeletionId(row.id || null);
                    }}
                    disabled={!row.id}
                    className={`grid w-full cursor-pointer gap-1 px-4 py-3 text-left transition-colors duration-100 ease-out active:bg-muted disabled:cursor-default sm:grid-cols-[10.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 ${
                      selected ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {deletionTitle(row)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[row.deletedEmail, row.deletedPhone].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">
                        {row.deleterName || "Unknown deleter"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[row.deleterRole, row.selfDeleted ? "Self-deleted" : ""]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground sm:text-right">
                      {sourceLabel(row.source)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          paginationInfo={{
            total: pagination.total,
            current: pagination.page || page,
            pageSize: pagination.limit || limit,
          }}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setLimit(next);
            setPage(1);
          }}
          pageSizeOptions={AUDIT_PAGE_SIZES}
          itemLabel={tab === "activity" ? "entries" : "deletions"}
          disabled={loading}
          className="rounded-none border-0 border-t"
        />
      </section>

      <AuditDetailSheet
        open={sheetOpen}
        detail={detailModel}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  emptyLabel,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
        {label}
      </span>
      <select
        className={controlClass}
        value={options.includes(value) ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium tracking-tight">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} cursor-text`}
      />
    </label>
  );
}

function ResultPill({ success }: { success: boolean | null }) {
  const tone =
    success === true
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : success === false
        ? "bg-red-500/10 text-red-700 dark:text-red-300"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {resultLabel(success)}
    </span>
  );
}
