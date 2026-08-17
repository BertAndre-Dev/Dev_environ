"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Check, Paperclip, X } from "lucide-react";
import Modal from "@/components/modal/page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy } from "@/lib/async-status";
import type { AppDispatch } from "@/redux/store";
import { getRequestActorDisplayName } from "@/lib/request-actor";
import {
  getRequestScopeApi,
  type RequestScope,
  type ScopedRequestItem,
  type ScopedRequestStatus,
} from "./request-scope";

const STATUS_LABELS: Record<ScopedRequestStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

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

function formatCategory(category?: string) {
  if (!category) return "—";
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStatusLabel(status?: ScopedRequestStatus) {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}

function formatRequestCode(code?: string) {
  const trimmed = code?.trim();
  return trimmed || "—";
}

function getStatusStyle(status?: ScopedRequestStatus) {
  if (status === "approved") return "bg-[#DCFCE7] text-[#16A34A]";
  if (status === "rejected" || status === "cancelled")
    return "bg-[#FEE2E2] text-[#DC2626]";
  if (status === "pending_approval") return "bg-[#FFEDD5] text-[#EA580C]";
  if (status === "draft") return "bg-[#F3F4F6] text-[#4B5563]";
  return "bg-[#E0E7FF] text-[#3730A3]";
}

function getActorName(
  actor?: string | { firstName?: string; lastName?: string; email?: string; name?: string },
) {
  return getRequestActorDisplayName(actor);
}

interface RequestDetailModalProps {
  scope: RequestScope;
  requestId: string | null;
  fallback?: ScopedRequestItem | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function RequestDetailModal({
  scope,
  requestId,
  fallback = null,
  onClose,
  onChanged,
}: RequestDetailModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const api = useMemo(() => getRequestScopeApi(scope), [scope]);
  const [comment, setComment] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { selected, getByIdStatus, decideStatus, cancelStatus } = useSelector(
    api.selectState,
  );

  const detailLoading = isBusy(getByIdStatus);
  const deciding = isBusy(decideStatus);
  const cancelling = isBusy(cancelStatus);
  const mutating = deciding || cancelling;

  let item: ScopedRequestItem | null = null;
  if (selected?.id === requestId) item = selected;
  else if (fallback?.id === requestId) item = fallback;
  else item = selected ?? fallback;

  useEffect(() => {
    if (!requestId) return;
    setComment("");
    setConfirmCancel(false);
    dispatch(api.getById(requestId))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });

    return () => {
      dispatch(api.clearSelected());
    };
  }, [api, dispatch, requestId]);

  if (!requestId) return null;

  const canDecide = item?.status === "pending_approval";
  const canCancel =
    item?.status === "pending_approval" || item?.status === "draft";

  const handleDecide = async (decision: "approve" | "reject") => {
    if (!item?.id) return;
    if (decision === "reject" && comment.trim().length < 3) {
      toast.error("Please provide a rejection reason (at least 3 characters).");
      return;
    }
    try {
      await dispatch(
        api.decide({
          id: item.id,
          decision,
          comment: comment.trim() || undefined,
        }),
      ).unwrap();
      toast.success(
        decision === "approve" ? "Request approved." : "Request rejected.",
      );
      setComment("");
      onChanged?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!item?.id) return;
    try {
      await dispatch(api.cancel(item.id)).unwrap();
      toast.success("Request cancelled.");
      setConfirmCancel(false);
      onChanged?.();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const showInitialLoader = detailLoading && !item;

  return (
    <Modal
      visible={Boolean(requestId)}
      onClose={onClose}
      contentClassName="max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="relative p-5 sm:p-6 space-y-4">
        {showInitialLoader ? (
          <div className="py-16">
            <Loader label="Loading request..." />
          </div>
        ) : !item ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">Unable to load this request.</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  {item.title || "Request"}
                </h2>
                {item.code ? (
                  <p className="mt-1 text-sm font-medium tracking-[0.02em] text-muted-foreground">
                    {formatRequestCode(item.code)}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(item.createdAt || item.updatedAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${getStatusStyle(item.status)}`}
              >
                {formatStatusLabel(item.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">{formatCategory(item.category)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created by</p>
                <p className="font-medium">{getActorName(item.createdBy)}</p>
              </div>
              {item.currentStepName || item.currentStepOrder != null ? (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Current step</p>
                  <p className="font-medium">
                    {item.currentStepName ||
                      `Step ${item.currentStepOrder}`}
                  </p>
                </div>
              ) : null}
            </div>

            {item.description ? (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{item.description}</p>
              </div>
            ) : null}

            {item.attachments && item.attachments.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Attachments</p>
                <ul className="space-y-1.5">
                  {item.attachments.map((url, index) => (
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

            {item.steps && item.steps.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Workflow steps</p>
                <ul className="space-y-2">
                  {item.steps.map((step, index) => (
                    <li
                      key={`${step.order ?? index}-${step.name ?? "step"}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {step.order != null ? `${step.order}. ` : ""}
                          {step.name || `Step ${index + 1}`}
                        </span>
                        {step.status ? (
                          <span className="text-xs text-muted-foreground capitalize">
                            {step.status.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                      {step.approverType ? (
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          Approver: {step.approverType.replaceAll("_", " ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.decisions && item.decisions.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Decision history</p>
                <ul className="space-y-2">
                  {item.decisions.map((decision, index) => (
                    <li
                      key={`${decision.decidedAt ?? index}-${decision.decision ?? "d"}`}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">
                          {decision.decision?.replaceAll("_", " ") || "Decision"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(decision.decidedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        By {getActorName(decision.decidedBy)}
                      </p>
                      {decision.comment ? (
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {decision.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {canDecide ? (
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label htmlFor="request-decision-comment">
                    Comment{" "}
                    {item.status === "pending_approval"
                      ? "(required to reject)"
                      : ""}
                  </Label>
                  <Textarea
                    id="request-decision-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a note for this decision..."
                    disabled={mutating}
                    className="min-h-24"
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    className="border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]"
                    disabled={mutating}
                    onClick={() => void handleDecide("reject")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    disabled={mutating}
                    onClick={() => void handleDecide("approve")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            ) : null}

            {canCancel ? (
              <div className="border-t border-border pt-4 space-y-3">
                {!confirmCancel ? (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={mutating}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel request
                  </Button>
                ) : (
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
                )}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose} disabled={mutating}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export {
  formatCategory,
  formatDate,
  formatRequestCode,
  formatStatusLabel,
  getActorName,
  getStatusStyle,
  STATUS_LABELS,
};
