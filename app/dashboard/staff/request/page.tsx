"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ClipboardList, Paperclip, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending } from "@/lib/async-status";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createStaffRequest,
  getStaffRequestCategories,
  getStaffRequests,
  STAFF_REQUEST_STATUS_OPTIONS,
  type CreateStaffRequestPayload,
  type StaffRequestCategory,
  type StaffRequestItem,
  type StaffRequestStatus,
} from "@/redux/slice/staff/request/staff-request";
import {
  setStaffRequestPage,
  setStaffRequestSearch,
  setStaffRequestStatusFilter,
} from "@/redux/slice/staff/request/staff-request-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import StaffRequestFormModal from "./components/StaffRequestFormModal";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatCategory(
  category?: string,
  categories: StaffRequestCategory[] = [],
) {
  if (!category) return "—";
  const match = categories.find((c) => c.value === category);
  if (match?.label) return match.label;
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_LABELS: Record<StaffRequestStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function formatStatusLabel(status?: StaffRequestStatus) {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}

function getStatusStyle(status?: StaffRequestStatus) {
  if (status === "approved") return "bg-[#DCFCE7] text-[#16A34A]";
  if (status === "rejected" || status === "cancelled")
    return "bg-[#FEE2E2] text-[#DC2626]";
  if (status === "pending_approval") return "bg-[#FFEDD5] text-[#EA580C]";
  if (status === "draft") return "bg-[#F3F4F6] text-[#4B5563]";
  return "bg-[#E0E7FF] text-[#3730A3]";
}

function getCreatedByName(item: StaffRequestItem) {
  const createdBy = item.createdBy;
  if (!createdBy) return "—";
  if (typeof createdBy === "string") return createdBy;
  const name = [createdBy.firstName, createdBy.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || "—";
}

export default function StaffRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<StaffRequestItem | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const {
    list,
    pagination,
    ui,
    categories,
    getListStatus,
    getCategoriesStatus,
    createStatus,
  } = useSelector((state: RootState) => state.staffRequest);

  const { page, pageSize, search, statusFilter } = ui;
  const listLoading = isPending(getListStatus);
  const categoriesLoading = isBusy(getCategoriesStatus);
  const creating = isBusy(createStatus);
  const fullPageLoading = bootstrapping || listLoading;

  const loadRequests = useCallback(() => {
    if (!estateId) return Promise.resolve();
    return dispatch(
      getStaffRequests({
        estateId,
        page,
        limit: pageSize,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, page, pageSize, statusFilter, search]);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const eId = extractEstateIdFromUser(data);
        const name = extractEstateNameFromUser(data) ?? "Estate";
        setEstateId(eId);
        setEstateName(name);
        if (!eId) {
          toast.error("Unable to resolve your estate. Please sign in again.");
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    dispatch(getStaffRequestCategories())
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch]);

  useEffect(() => {
    if (!estateId || bootstrapping) return;
    loadRequests().catch(() => {});
  }, [estateId, bootstrapping, loadRequests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== search) {
        dispatch(setStaffRequestSearch(searchInput));
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [dispatch, searchInput, search]);

  const handleCreate = async (
    payload: Omit<CreateStaffRequestPayload, "estateId">,
  ) => {
    if (!estateId) {
      toast.error("Missing estate info.");
      return;
    }
    try {
      await dispatch(
        createStaffRequest({
          ...payload,
          estateId,
        }),
      ).unwrap();
      toast.success("Request submitted for approval.");
      setCreateOpen(false);
      await loadRequests();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Submitted",
        render: (item: StaffRequestItem) =>
          formatDate(item.createdAt || item.updatedAt),
        exportValue: (item: StaffRequestItem) =>
          formatDate(item.createdAt || item.updatedAt),
      },
      {
        key: "title",
        header: "Title",
        render: (item: StaffRequestItem) => (
          <div>
            <p className="font-medium text-foreground">{item.title || "—"}</p>
            {item.description ? (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {item.description}
              </p>
            ) : null}
          </div>
        ),
        exportValue: (item: StaffRequestItem) => item.title || "—",
      },
      {
        key: "category",
        header: "Category",
        render: (item: StaffRequestItem) =>
          formatCategory(item.category, categories),
        exportValue: (item: StaffRequestItem) =>
          formatCategory(item.category, categories),
      },
      {
        key: "status",
        header: "Status",
        render: (item: StaffRequestItem) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
          >
            {formatStatusLabel(item.status)}
          </span>
        ),
        exportValue: (item: StaffRequestItem) =>
          formatStatusLabel(item.status),
      },
      {
        key: "createdBy",
        header: "Created by",
        render: (item: StaffRequestItem) => getCreatedByName(item),
        exportValue: (item: StaffRequestItem) => getCreatedByName(item),
      },
      {
        key: "attachments",
        header: "Files",
        render: (item: StaffRequestItem) =>
          item.attachments && item.attachments.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-[#2563EB]">
              <Paperclip className="h-3.5 w-3.5" />
              {item.attachments.length}
            </span>
          ) : (
            "—"
          ),
        exportValue: (item: StaffRequestItem) =>
          String(item.attachments?.length ?? 0),
      },
      {
        key: "actions",
        header: "Actions",
        render: (item: StaffRequestItem) => (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF]"
            onClick={() => setViewing(item)}
          >
            View
          </Button>
        ),
        exportable: false,
      },
    ],
    [categories],
  );

  const total = pagination?.total ?? list.length;
  const canCreate = Boolean(estateId);

  return (
    <div className="relative">
      {fullPageLoading && <Loader fullScreen label="Loading requests..." />}

      <div
        className={[
          "space-y-6",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Requests Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and track approval requests for{" "}
              <span className="font-bold uppercase underline text-foreground">
                {estateName}
              </span>
              .
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              New request
            </Button>
          )}
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Select
              options={STAFF_REQUEST_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) =>
                dispatch(
                  setStaffRequestStatusFilter(
                    e.target.value as StaffRequestStatus | "",
                  ),
                )
              }
              className="lg:max-w-[220px] rounded-xl"
            />
          </div>

          {!fullPageLoading && list.length === 0 ? (
            <div className="py-12 rounded-lg border border-border bg-muted/20 text-center space-y-2">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No requests found.</p>
              {canCreate && (
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first request
                </Button>
              )}
            </div>
          ) : (
            <Table
              columns={columns}
              data={list}
              emptyMessage="No requests found."
              showPagination
              paginationInfo={{
                total,
                current: page,
                pageSize,
              }}
              onPageChange={(nextPage) =>
                dispatch(setStaffRequestPage(nextPage))
              }
            />
          )}
        </Card>
      </div>

      {createOpen && estateId && (
        <StaffRequestFormModal
          visible={createOpen}
          estateId={estateId}
          categories={categories}
          categoriesLoading={categoriesLoading}
          loading={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {viewing && (
        <Modal
          visible={Boolean(viewing)}
          onClose={() => setViewing(null)}
          contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {viewing.title || "Request"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(viewing.createdAt || viewing.updatedAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${getStatusStyle(viewing.status)}`}
              >
                {formatStatusLabel(viewing.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">
                  {formatCategory(viewing.category, categories)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{getCreatedByName(viewing)}</p>
              </div>
            </div>

            {viewing.description ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{viewing.description}</p>
              </div>
            ) : null}

            {viewing.attachments && viewing.attachments.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                <ul className="space-y-1.5">
                  {viewing.attachments.map((url, index) => (
                    <li key={`${url.slice(0, 24)}-${index}`}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Attachment {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
