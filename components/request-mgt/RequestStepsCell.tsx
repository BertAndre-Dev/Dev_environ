"use client";

import {
  formatRequestStatusLabel,
  formatStepAssignees,
  getRequestStatusStyle,
  type RequestWorkflowStep,
} from "@/lib/request-record";

export function RequestStepsCell({
  steps,
  fallbackName,
}: {
  steps?: RequestWorkflowStep[];
  fallbackName?: string;
}) {
  const list = steps ?? [];
  if (list.length === 0) {
    return (
      <span className="text-foreground">{fallbackName?.trim() || "—"}</span>
    );
  }

  return (
    <ul className="space-y-1.5 min-w-[12rem]">
      {list.map((step, index) => (
        <li
          key={`${step.order ?? index}-${step.name ?? "step"}`}
          className="flex flex-col gap-0.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {step.order != null ? `${step.order}. ` : ""}
              {step.name || `Step ${index + 1}`}
            </span>
            {step.status ? (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize shrink-0 ${getRequestStatusStyle(step.status)}`}
              >
                {formatRequestStatusLabel(step.status)}
              </span>
            ) : null}
          </div>
          {formatStepAssignees(step) !== "—" ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {formatStepAssignees(step)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
