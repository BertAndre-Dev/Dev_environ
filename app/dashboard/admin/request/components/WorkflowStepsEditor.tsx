"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  APPROVAL_MODE_OPTIONS,
  APPROVER_TYPE_OPTIONS,
  type ApprovalMode,
  type ApproverType,
  type WorkflowStep,
  createEmptyWorkflowStep,
} from "@/redux/slice/admin/request/admin-request";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import type { AppDispatch } from "@/redux/store";
import { normalizeUserId } from "@/lib/user-id";

interface EstateUserOption {
  id: string;
  label: string;
}

interface WorkflowStepsEditorProps {
  readonly steps: WorkflowStep[];
  readonly onChange: (steps: WorkflowStep[]) => void;
  readonly estateId?: string | null;
  readonly disabled?: boolean;
}

function renumber(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

function userLabel(raw: Record<string, unknown>): string {
  const first = String(raw.firstName ?? "").trim();
  const last = String(raw.lastName ?? "").trim();
  const name = [first, last].filter(Boolean).join(" ");
  const email = String(raw.email ?? "").trim();
  if (name && email) return `${name} (${email})`;
  return name || email || "User";
}

export default function WorkflowStepsEditor({
  steps,
  onChange,
  estateId,
  disabled = false,
}: WorkflowStepsEditorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [userOptions, setUserOptions] = useState<EstateUserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const needsUsers = steps.some((s) => s.approverType === "user");

  useEffect(() => {
    if (!needsUsers || !estateId) return;
    let cancelled = false;
    (async () => {
      setUsersLoading(true);
      try {
        const res = await dispatch(
          getAllUsersByEstate({
            estateId,
            page: 1,
            limit: 200,
            role: "staff",
          }),
        ).unwrap();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (cancelled) return;
        setUserOptions(
          list
            .map((u: Record<string, unknown>) => {
              const id = normalizeUserId(u._id ?? u.id ?? u.userId);
              if (!id) return null;
              return { id, label: userLabel(u) };
            })
            .filter(Boolean) as EstateUserOption[],
        );
      } catch {
        if (!cancelled) setUserOptions([]);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, estateId, needsUsers]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter(
      (u) =>
        u.label.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
    );
  }, [userOptions, userSearch]);

  const updateStep = (index: number, patch: Partial<WorkflowStep>) => {
    onChange(
      steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    );
  };

  const addStep = () => {
    onChange(renumber([...steps, createEmptyWorkflowStep(steps.length + 1)]));
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    onChange(renumber(steps.filter((_, i) => i !== index)));
  };

  const toggleUser = (index: number, userId: string) => {
    const step = steps[index];
    const current = step.userIds ?? [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    updateStep(index, { userIds: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            Approval steps
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
            Ordered path — estate admin, company, admin, or specific users.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          disabled={disabled}
          className="shrink-0 active:scale-[0.97] transition-transform duration-100 ease-out"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add step
        </Button>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={`step-${index}`}
            className="rounded-2xl border border-black/5 bg-[#F7F8FA] p-4 space-y-4 transition-[background-color,box-shadow] duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0150AC]/10 text-sm font-semibold text-[#0150AC] tabular-nums"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-foreground truncate">
                  {step.name?.trim() || `Step ${index + 1}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeStep(index)}
                disabled={disabled || steps.length <= 1}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#D31510] hover:bg-[#D31510]/8 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97] transition-[transform,background-color] duration-100 ease-out cursor-pointer"
                aria-label={`Remove step ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <Label htmlFor={`step-name-${index}`}>Step name</Label>
                <Input
                  id={`step-name-${index}`}
                  value={step.name}
                  onChange={(e) => updateStep(index, { name: e.target.value })}
                  placeholder="e.g. Estate admin approval"
                  className="mt-1.5 rounded-xl"
                  disabled={disabled}
                />
              </div>

              <div>
                <Label htmlFor={`step-approver-${index}`}>Approver type</Label>
                <Select
                  id={`step-approver-${index}`}
                  options={APPROVER_TYPE_OPTIONS}
                  value={step.approverType}
                  onChange={(e) =>
                    updateStep(index, {
                      approverType: e.target.value as ApproverType,
                      userIds:
                        e.target.value === "user" ? step.userIds ?? [] : [],
                    })
                  }
                  className="mt-1.5 w-full rounded-xl"
                  disabled={disabled}
                />
              </div>

              <div>
                <Label htmlFor={`step-mode-${index}`}>Approval mode</Label>
                <Select
                  id={`step-mode-${index}`}
                  options={APPROVAL_MODE_OPTIONS}
                  value={step.approvalMode}
                  onChange={(e) =>
                    updateStep(index, {
                      approvalMode: e.target.value as ApprovalMode,
                    })
                  }
                  className="mt-1.5 w-full rounded-xl"
                  disabled={disabled}
                />
              </div>

              {step.approverType === "user" && (
                <div className="md:col-span-2 space-y-2.5">
                  <Label>Approver users</Label>
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search staff by name or email..."
                    className="rounded-xl"
                    disabled={disabled || !estateId}
                  />
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-black/5 bg-white/80 backdrop-blur-sm divide-y divide-black/5">
                    {usersLoading ? (
                      <p className="px-3 py-4 text-sm text-muted-foreground">
                        Loading users...
                      </p>
                    ) : null}
                    {!usersLoading && filteredUsers.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-muted-foreground">
                        {estateId
                          ? "No staff users found."
                          : "Estate required to load users."}
                      </p>
                    ) : null}
                    {!usersLoading &&
                      filteredUsers.map((user) => {
                        const checked = (step.userIds ?? []).includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-black/3 active:bg-black/5 transition-colors duration-100"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUser(index, user.id)}
                              disabled={disabled}
                              className="size-4 rounded border-input accent-[#0150AC]"
                            />
                            <span className="min-w-0 truncate">{user.label}</span>
                          </label>
                        );
                      })}
                  </div>
                  {(step.userIds?.length ?? 0) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {step.userIds?.length} selected
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-black/5 px-3 py-1.5 text-sm cursor-pointer select-none active:scale-[0.98] transition-transform duration-100 ease-out">
                <input
                  type="checkbox"
                  checked={step.allowReject}
                  onChange={(e) =>
                    updateStep(index, { allowReject: e.target.checked })
                  }
                  disabled={disabled}
                  className="size-4 rounded border-input accent-[#0150AC]"
                />
                Allow reject
              </label>
              <label className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-black/5 px-3 py-1.5 text-sm cursor-pointer select-none active:scale-[0.98] transition-transform duration-100 ease-out">
                <input
                  type="checkbox"
                  checked={step.reminderEnabled}
                  onChange={(e) =>
                    updateStep(index, { reminderEnabled: e.target.checked })
                  }
                  disabled={disabled}
                  className="size-4 rounded border-input accent-[#0150AC]"
                />
                Enable reminders
              </label>
            </div>

            {step.reminderEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <Label htmlFor={`step-interval-${index}`}>
                    Reminder interval (hours)
                  </Label>
                  <Input
                    id={`step-interval-${index}`}
                    type="number"
                    min={1}
                    value={step.reminderIntervalHours ?? 24}
                    onChange={(e) =>
                      updateStep(index, {
                        reminderIntervalHours: Number(e.target.value) || 24,
                      })
                    }
                    className="mt-1.5 rounded-xl"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`step-max-${index}`}>Max reminders</Label>
                  <Input
                    id={`step-max-${index}`}
                    type="number"
                    min={1}
                    value={step.reminderMaxCount ?? 3}
                    onChange={(e) =>
                      updateStep(index, {
                        reminderMaxCount: Number(e.target.value) || 3,
                      })
                    }
                    className="mt-1.5 rounded-xl"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
