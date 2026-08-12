"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ClipboardList, Pencil, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/Loader";
import { getApiErrorMessage } from "@/lib/api-error";
import { isBusy, isPending } from "@/lib/async-status";
import {
  extractEstateIdFromUser,
  extractEstateNameFromUser,
} from "@/lib/user-id";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  APPROVER_TYPE_OPTIONS,
  getAdminRequestWorkflow,
  upsertAdminRequestWorkflow,
  type WorkflowStep,
} from "@/redux/slice/admin/request/admin-request";
import type { AppDispatch, RootState } from "@/redux/store";
import WorkflowConfigModal from "./components/WorkflowConfigModal";

function formatApproverType(type: string) {
  return (
    APPROVER_TYPE_OPTIONS.find((o) => o.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

export default function AdminRequestPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { workflow, getWorkflowStatus, upsertWorkflowStatus } = useSelector(
    (state: RootState) => state.adminRequest,
  );

  const loadingWorkflow = isPending(getWorkflowStatus);
  const saving = isBusy(upsertWorkflowStatus);
  const fullPageLoading = bootstrapping || loadingWorkflow;

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = (userRes?.data ?? userRes) as Record<string, unknown>;
        const eId = extractEstateIdFromUser(data);
        const eName = extractEstateNameFromUser(data) ?? "Estate";
        setEstateId(eId);
        setEstateName(eName);
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
    if (!estateId || bootstrapping) return;
    dispatch(getAdminRequestWorkflow(estateId))
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, estateId, bootstrapping]);

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

  const hasWorkflow = Boolean(workflow?.name);

  return (
    <div className="relative">
      {fullPageLoading && (
        <Loader fullScreen label="Loading request workflow..." />
      )}

      <div
        className={[
          "space-y-6",
          fullPageLoading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D0DFF280]">
                <ClipboardList className="w-5 h-5 text-[#0150AC]" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-[-0.02em]">
                Request Management
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 leading-snug">
              Configure the approval workflow for{" "}
              <span className="font-semibold uppercase underline text-foreground">
                {estateName}
              </span>
              .
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={!estateId}
            className="shrink-0 rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
          >
            {hasWorkflow ? (
              <>
                <Pencil className="w-4 h-4 mr-2" />
                Edit workflow
              </>
            ) : (
              <>
                <Settings2 className="w-4 h-4 mr-2" />
                Configure workflow
              </>
            )}
          </Button>
        </div>

        <Card className="p-5 sm:p-6 rounded-2xl border-black/5 shadow-sm">
          {!hasWorkflow ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F7F8FA]">
                <Settings2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No approval workflow configured yet.
              </p>
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                disabled={!estateId}
                className="rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Configure workflow
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="rounded-full active:scale-[0.97] transition-transform duration-100 ease-out"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
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
      </div>

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
    </div>
  );
}
