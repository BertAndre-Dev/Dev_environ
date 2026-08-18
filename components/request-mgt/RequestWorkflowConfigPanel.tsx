"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Settings2 } from "lucide-react";
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
import {
  fetchWorkflowEstateUsers,
  type WorkflowEstateUser,
} from "@/components/request-mgt/workflow-users";
import WorkflowConfigModal from "./WorkflowConfigModal";

function formatApproverType(type: string) {
  return (
    APPROVER_TYPE_OPTIONS.find((o) => o.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

function StepUsers({
  userIds,
  usersById,
}: Readonly<{
  userIds?: string[];
  usersById: Map<string, WorkflowEstateUser>;
}>) {
  if (!userIds?.length) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {userIds.map((id) => {
        const user = usersById.get(id);
        return (
          <li
            key={id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white border border-black/8 px-2.5 py-1 text-xs"
          >
            <span className="truncate font-medium text-foreground">
              {user?.name ?? id}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="shrink-0 text-muted-foreground">
              {user?.roleLabel ?? "User"}
            </span>
          </li>
        );
      })}
    </ul>
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
}: Readonly<RequestWorkflowConfigPanelProps>) {
  const dispatch = useDispatch<AppDispatch>();
  const [modalOpen, setModalOpen] = useState(false);
  const [estateUsers, setEstateUsers] = useState<WorkflowEstateUser[]>([]);

  const { workflows, getWorkflowStatus, upsertWorkflowStatus } = useSelector(
    (state: RootState) => state.adminRequest,
  );

  const loadingWorkflow = isPending(getWorkflowStatus);
  const saving = isBusy(upsertWorkflowStatus);
  const hasWorkflows = workflows.length > 0;

  const usersById = useMemo(() => {
    const map = new Map<string, WorkflowEstateUser>();
    estateUsers.forEach((user) => map.set(user.id, user));
    return map;
  }, [estateUsers]);

  useEffect(() => {
    if (!estateId || !enabled) return;
    dispatch(getAdminRequestWorkflow(estateId))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, enabled]);

  useEffect(() => {
    if (!estateId || !enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const users = await fetchWorkflowEstateUsers(dispatch, estateId);
        if (!cancelled) setEstateUsers(users);
      } catch {
        if (!cancelled) setEstateUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          isActive: true,
        }),
      ).unwrap();
      toast.success("Request workflow saved.");
      setModalOpen(false);
      await dispatch(getAdminRequestWorkflow(estateId)).unwrap();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
      throw err;
    }
  };

  const setWorkflowButton = (
    <Button
      onClick={() => setModalOpen(true)}
      disabled={!estateId}
      size={compact ? "sm" : "default"}
      variant="outline"
      className="shrink-0 rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
    >
      <Settings2 className="w-4 h-4 mr-2" />
      Set workflow
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
        ) : !hasWorkflows ? (
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
            {setWorkflowButton}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-[-0.01em]">
                  Approval workflows
                </h2>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  Same name updates an existing workflow. A new name creates
                  another.
                </p>
              </div>
              {setWorkflowButton}
            </div>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={
                    workflow.id ??
                    workflow._id ??
                    `${workflow.name}-${workflow.createdAt ?? ""}`
                  }
                  className="space-y-3 rounded-2xl border border-black/5 bg-white p-4"
                >
                  <div>
                    <h3 className="font-heading text-lg font-semibold tracking-[-0.01em]">
                      {workflow.name}
                    </h3>
                    {workflow.description ? (
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {workflow.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Approval steps ({workflow.steps.length})
                    </p>
                    <ol className="space-y-2">
                      {workflow.steps.map((step) => (
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
                            <span>
                              {formatApproverType(step.approverType)}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="capitalize">
                              {step.approvalMode}
                            </span>
                          </div>
                          <StepUsers
                            userIds={step.userIds}
                            usersById={usersById}
                          />
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {modalOpen && (
        <WorkflowConfigModal
          visible={modalOpen}
          estateId={estateId}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
