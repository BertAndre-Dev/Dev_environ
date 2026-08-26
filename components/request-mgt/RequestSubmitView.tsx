"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Check, ClipboardList, Paperclip, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/modal/page";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending } from "@/lib/async-status";
import {
  cancelStaffRequest,
  createStaffRequest,
  decideStaffRequest,
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
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  requestDestructiveOutlineButtonClass,
  requestViewButtonClass,
} from "@/components/request-mgt/request-action-styles";
import { getRequestActorDisplayName } from "@/lib/request-actor";
import {
  currentStepAllowsReject,
  formatStepAssignees,
  getCurrentRequestStep,
  isUserAssignedToCurrentStep,
} from "@/lib/request-record";
import {
  extractSignedInUserEmail,
  extractSignedInUserIds,
} from "@/lib/user-id";
import {
  openAttachmentInNewTab,
} from "@/lib/download-attachment";
import StaffRequestFormModal from "./StaffRequestFormModal";
import RequestComments from "./RequestComments";
import { RequestRecordDetails } from "./RequestRecordDetails";

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
  return getRequestActorDisplayName(item.createdBy);
}

function formatCurrentStep(item: StaffRequestItem) {
  return item.currentStepName?.trim() || "—";
}

function formatCurrentAssignees(item: StaffRequestItem) {
  return formatStepAssignees(getCurrentRequestStep(item));
}

export interface RequestSubmitViewProps {
  estateId: string | null;
  estateName?: string;
  bootstrapping?: boolean;
  title?: string;
  description?: ReactNode;
  /** Nested under another page header — no full-screen overlay, section heading. */
  embedded?: boolean;
  /** Hide the section title/description (e.g. when a parent tab already labels the view). */
  hideHeading?: boolean;
}

export default function RequestSubmitView({
  estateId,
  estateName = "Estate",
  bootstrapping = false,
  title = "Requests Management",
  description,
  embedded = false,
  hideHeading = false,
}: RequestSubmitViewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<StaffRequestItem | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [comment, setComment] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const {
    list,
    pagination,
    ui,
    categories,
    getListStatus,
    getCategoriesStatus,
    createStatus,
    decideStatus,
    cancelStatus,
  } = useSelector((state: RootState) => state.staffRequest);
  const signedInUser = useSelector(
    (state: RootState) =>
      (state.auth.user ?? null) as Record<string, unknown> | null,
  );
  const signedInUserIds = extractSignedInUserIds(signedInUser);
  const signedInUserEmail = extractSignedInUserEmail(signedInUser);

  const { page, pageSize, search, statusFilter } = ui;
  const listLoading = isPending(getListStatus);
  const categoriesLoading = isBusy(getCategoriesStatus);
  const creating = isBusy(createStatus);
  const deciding = isBusy(decideStatus);
  const cancelling = isBusy(cancelStatus);
  const mutating = deciding || cancelling;
  const fullPageLoading = bootstrapping || listLoading;
  const showOverlayLoader = fullPageLoading && !embedded;
  const showSectionLoader = fullPageLoading && embedded;

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
    dispatch(getSignedInUser()).catch(() => {});
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

  const viewingLive = useMemo(() => {
    if (!viewing) return null;
    return list.find((item) => item.id === viewing.id) ?? viewing;
  }, [list, viewing]);

  const assignedToCurrentStep = Boolean(
    viewingLive &&
      isUserAssignedToCurrentStep(
        viewingLive,
        signedInUserIds,
        signedInUserEmail,
      ),
  );
  const canDecide =
    viewingLive?.status === "pending_approval" && assignedToCurrentStep;
  const canReject =
    Boolean(canDecide && viewingLive) &&
    currentStepAllowsReject(viewingLive ?? {});
  const canCancel =
    viewingLive?.status === "pending_approval" && assignedToCurrentStep;

  useEffect(() => {
    setComment("");
    setConfirmCancel(false);
  }, [viewing?.id]);

  const closeViewing = () => {
    setViewing(null);
    setComment("");
    setConfirmCancel(false);
  };

  const handleDecide = async (decision: "approve" | "reject") => {
    if (!viewingLive?.id) return;
    if (decision === "reject" && comment.trim().length < 3) {
      toast.error("A rejection reason of at least 3 characters is required.");
      return;
    }
    try {
      await dispatch(
        decideStaffRequest({
          id: viewingLive.id,
          decision,
          comment: comment.trim() || undefined,
          estateId: estateId || viewingLive.estateId,
        }),
      ).unwrap();
      toast.success(
        decision === "approve" ? "Request approved." : "Request rejected.",
      );
      closeViewing();
      await loadRequests();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!viewingLive?.id) return;
    try {
      await dispatch(
        cancelStaffRequest({
          id: viewingLive.id,
          estateId: estateId || viewingLive.estateId,
        }),
      ).unwrap();
      toast.success("Request cancelled.");
      closeViewing();
      await loadRequests();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "Code",
        render: (item: StaffRequestItem) => (
          <span className="font-medium tracking-[0.02em] text-foreground">
            {item.code?.trim() || "—"}
          </span>
        ),
        exportValue: (item: StaffRequestItem) => item.code?.trim() || "—",
      },
      {
        key: "createdAt",
        header: "Created",
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
        key: "currentStep",
        header: "Current step",
        render: (item: StaffRequestItem) => {
          const assignees = formatCurrentAssignees(item);
          return (
            <div>
              <p className="font-medium text-foreground">
                {formatCurrentStep(item)}
              </p>
              {assignees !== "—" ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {assignees}
                </p>
              ) : null}
            </div>
          );
        },
        exportValue: (item: StaffRequestItem) => {
          const assignees = formatCurrentAssignees(item);
          const step = formatCurrentStep(item);
          return assignees !== "—" ? `${step} (${assignees})` : step;
        },
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
        key: "actions",
        header: "Actions",
        render: (item: StaffRequestItem) => (
          <Button
            size="sm"
            variant="outline"
            className={requestViewButtonClass}
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
  const resolvedDescription =
    description ?? (
      <span>
        Create and track approval requests for{" "}
        <span className="font-bold uppercase underline text-foreground">
          {estateName}
        </span>
        .
      </span>
    );

  return (
    <div className="relative">
      {showOverlayLoader ? (
        <Loader fullScreen label="Loading requests..." />
      ) : null}
      {showSectionLoader ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/40 backdrop-blur-sm">
          <Loader label="Loading requests..." />
        </div>
      ) : null}

      <div
        className={[
          "space-y-6",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {hideHeading ? null : (
            <div>
              {embedded ? (
                <h2 className="font-heading text-2xl font-bold tracking-[-0.02em]">
                  {title}
                </h2>
              ) : (
                <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
                  {title}
                </h1>
              )}
              <p className="text-muted-foreground mt-1 leading-snug">
                {resolvedDescription}
              </p>
            </div>
          )}
          {canCreate && (
            <Button
              onClick={() => setCreateOpen(true)}
              className={`shrink-0 rounded-full active:scale-[0.97] transition-transform duration-100 ease-out ${
                hideHeading ? "ml-auto" : ""
              }`}
            >
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

      {viewingLive && (
        <Modal
          visible={Boolean(viewingLive)}
          onClose={closeViewing}
          contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {viewingLive.title || "Request"}
                </h2>
                {viewingLive.code ? (
                  <p className="mt-1 text-sm font-medium tracking-[0.02em] text-muted-foreground">
                    {viewingLive.code}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(viewingLive.createdAt || viewingLive.updatedAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${getStatusStyle(viewingLive.status)}`}
              >
                {formatStatusLabel(viewingLive.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">
                  {formatCategory(viewingLive.category, categories)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{getCreatedByName(viewingLive)}</p>
              </div>
              {viewingLive.currentStepName ||
              viewingLive.currentStepOrder != null ? (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Current step</p>
                  <p className="font-medium">
                    {formatCurrentStep(viewingLive)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrentAssignees(viewingLive)}
                  </p>
                </div>
              ) : null}
            </div>

            {viewingLive.description ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingLive.description}
                </p>
              </div>
            ) : null}

            <RequestRecordDetails
              fieldValues={viewingLive.fieldValues}
              steps={viewingLive.steps}
              currentStepOrder={viewingLive.currentStepOrder}
            />

            {viewingLive.attachments && viewingLive.attachments.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                <ul className="space-y-1.5">
                  {viewingLive.attachments.map((url, index) => (
                    <li key={`${url.slice(0, 24)}-${index}`}>
                      <button
                        type="button"
                        onClick={() => openAttachmentInNewTab(url)}
                        className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline cursor-pointer"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Attachment {index + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <RequestComments
              requestId={viewingLive.id}
              estateId={estateId || viewingLive.estateId}
            />

            {canDecide || canCancel ? (
              <div className="space-y-3 border-t border-border pt-4">
                {canDecide ? (
                  <div>
                    <Label htmlFor="staff-request-decision-comment">
                      Decision note{" "}
                      <span className="text-muted-foreground font-normal">
                        {canReject ? "(required to reject)" : "(optional)"}
                      </span>
                    </Label>
                    <Textarea
                      id="staff-request-decision-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a note for this decision..."
                      disabled={mutating}
                      className="min-h-24"
                    />
                  </div>
                ) : null}

                {confirmCancel ? (
                  <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 space-y-3">
                    <p className="text-sm text-[#991B1B]">
                      Cancel this request? This cannot be undone.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        disabled={mutating}
                        onClick={() => setConfirmCancel(false)}
                      >
                        Keep request
                      </Button>
                      <Button
                        className="bg-[#DC2626] hover:bg-[#B91C1C]"
                        disabled={mutating}
                        onClick={() => void handleCancel()}
                      >
                        Confirm cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                    {canCancel ? (
                      <Button
                        variant="outline"
                        className={requestDestructiveOutlineButtonClass}
                        disabled={mutating}
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancel request
                      </Button>
                    ) : null}
                    {canReject ? (
                      <Button
                        variant="outline"
                        className={requestDestructiveOutlineButtonClass}
                        disabled={mutating}
                        onClick={() => void handleDecide("reject")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    ) : null}
                    {canDecide ? (
                      <Button
                        disabled={mutating}
                        onClick={() => void handleDecide("approve")}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}
