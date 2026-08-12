"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  APPROVAL_MODE_OPTIONS,
  APPROVER_TYPE_OPTIONS,
  type ApprovalMode,
  type ApproverType,
  type WorkflowStep,
  createEmptyWorkflowStep,
} from "@/redux/slice/admin/request/admin-request";

interface WorkflowStepsEditorProps {
  readonly steps: WorkflowStep[];
  readonly onChange: (steps: WorkflowStep[]) => void;
  readonly disabled?: boolean;
}

function renumber(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, index) => ({ ...step, order: index + 1 }));
}

export default function WorkflowStepsEditor({
  steps,
  onChange,
  disabled = false,
}: WorkflowStepsEditorProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Approval steps</h3>
          <p className="text-sm text-muted-foreground">
            Steps run in order. Approvers can be a role or a specific user.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add step
        </Button>
      </div>

      {steps.map((step, index) => (
        <Card key={`step-${index}`} className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Step {index + 1}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeStep(index)}
              disabled={disabled || steps.length <= 1}
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor={`step-name-${index}`}>Step name</Label>
              <Input
                id={`step-name-${index}`}
                value={step.name}
                onChange={(e) => updateStep(index, { name: e.target.value })}
                placeholder="e.g. Estate admin approval"
                className="mt-1"
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
                className="mt-1 w-full"
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
                className="mt-1 w-full"
                disabled={disabled}
              />
            </div>

            {step.approverType === "user" && (
              <div className="md:col-span-2">
                <Label htmlFor={`step-users-${index}`}>
                  User IDs{" "}
                  <span className="text-muted-foreground font-normal">
                    (comma-separated)
                  </span>
                </Label>
                <Input
                  id={`step-users-${index}`}
                  value={(step.userIds ?? []).join(", ")}
                  onChange={(e) =>
                    updateStep(index, {
                      userIds: e.target.value
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="64f1a..., 64f1b..."
                  className="mt-1"
                  disabled={disabled}
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={step.allowReject}
                onChange={(e) =>
                  updateStep(index, { allowReject: e.target.checked })
                }
                disabled={disabled}
                className="size-4 rounded border-input"
              />
              Allow reject
            </label>
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={step.reminderEnabled}
                onChange={(e) =>
                  updateStep(index, { reminderEnabled: e.target.checked })
                }
                disabled={disabled}
                className="size-4 rounded border-input"
              />
              Enable reminders
            </label>
          </div>

          {step.reminderEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="mt-1"
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
                  className="mt-1"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
