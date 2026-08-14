"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Pencil, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending } from "@/lib/async-status";
import {
  APPROVER_TYPE_OPTIONS,
  getAdminRequestWorkflow,
  upsertAdminRequestWorkflow,
  type WorkflowStep,
} from "@/redux/slice/admin/request/admin-request";
import type { AppDispatch, RootState } from "@/redux/store";
import WorkflowConfigModal from "./WorkflowConfigModal";

function formatApproverType(type: string) {
  return (
    APPROVER_TYPE_OPTIONS.find((o) => o.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export interface RequestWorkflowConfigPanelProps {
  estateId: string | null;
  /** When false, skip auto-fetch (e.g. parent still bootstrapping). */
  enabled?: boolean;
  /** Compact mode: summary card only (no page-level title). */
  compact?: boolean;
  /** Optional label for empty / header context. */
  estateLabel?: string;
}

export default function RequestWorkflowConfigPanel({
  estateId,
  enabled = true,
  compact = false,
  estateLabel,
}: RequestWorkflowConfigPanelProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [modalOpen, setModalOpen] = useState(false);

  const { workflow, getWorkflowStatus, upsertWorkflowStatus } = useSelector(
    (state: RootState) => state.adminRequest,
  );

  const loadingWorkflow = isPending(getWorkflowStatus);
  const saving = isBusy(upsertWorkflowStatus);
  const hasWorkflow = Boolean(workflow?.name);

  useEffect(() => {
    if (!estateId || !enabled) return;
    dispatch(getAdminRequestWorkflow(estateId))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, enabled]);

  const handleSave = async (payload: {
    name: string;
    description?: string;
    steps: WorkflowStep[];
  }) => {
    if (!estateId) {
      toast.error("Missing estate info.");
      return;
    }
    try {
      await dispatch(
        upsertAdminRequestWorkflow({
          ...payload,
          estateId,
        }),
      ).unwrap();
      toast.success("Request workflow saved.");
      setModalOpen(false);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const editWorkflowButton = (
    <Button
      onClick={() => setModalOpen(true)}
      disabled={!estateId}
      size={compact ? "sm" : "default"}
      variant="outline"
      className="shrink-0 rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
    >
      <Pencil className="w-4 h-4 mr-2" />
      Edit workflow
    </Button>
  );

  return (
    <>
      <Card
        className={
          compact
            ? "p-4 sm:p-5 rounded-2xl border-black/5 shadow-sm"
            : "p-5 sm:p-6 rounded-2xl border-black/5 shadow-sm"
        }
      >
        {loadingWorkflow && estateId ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Loading workflow...
          </p>
        ) : !hasWorkflow ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F7F8FA]">
              <Settings2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No approval workflow configured yet
              {estateLabel ? (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-foreground">
                    {estateLabel}
                  </span>
                </>
              ) : null}
              .
            </p>
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
              disabled={!estateId}
              className="rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Set workflow
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
                  {workflow?.name}
                </h2>
                {workflow?.description ? (
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">
                    {workflow.description}
                  </p>
                ) : null}
              </div>
              {editWorkflowButton}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Approval steps ({workflow?.steps.length ?? 0})
              </p>
              <ol className="space-y-2">
                {(workflow?.steps ?? []).map((step) => (
                  <li
                    key={`${step.order}-${step.name}`}
                    className="rounded-2xl border border-black/5 bg-[#F7F8FA] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#0150AC]/10 text-xs font-semibold text-[#0150AC] tabular-nums">
                        {step.order}
                      </span>
                      <span className="font-medium">{step.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{formatApproverType(step.approverType)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="capitalize">{step.approvalMode}</span>
                      {step.approverType === "user" &&
                        (step.userIds?.length ?? 0) > 0 && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                              {step.userIds?.length} user
                              {(step.userIds?.length ?? 0) === 1 ? "" : "s"}
                            </span>
                          </>
                        )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Card>

      {modalOpen && (
        <WorkflowConfigModal
          visible={modalOpen}
          estateId={estateId}
          workflow={workflow}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
