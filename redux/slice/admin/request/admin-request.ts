import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";

export const APPROVER_TYPES = [
  "estate_admin",
  "company",
  "admin",
  "user",
] as const;

export type ApproverType = (typeof APPROVER_TYPES)[number];

export const APPROVAL_MODES = ["any", "all"] as const;
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export const APPROVER_TYPE_OPTIONS: { value: ApproverType; label: string }[] = [
  { value: "estate_admin", label: "Estate admin" },
  { value: "company", label: "Company" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "Specific user" },
];

export const APPROVAL_MODE_OPTIONS: { value: ApprovalMode; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "all", label: "All" },
];

export interface WorkflowStep {
  order: number;
  name: string;
  approverType: ApproverType;
  userIds?: string[];
  approvalMode: ApprovalMode;
  allowReject: boolean;
  reminderEnabled: boolean;
  reminderIntervalHours?: number;
  reminderMaxCount?: number;
}

export interface RequestWorkflow {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  estateId: string;
  steps: WorkflowStep[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertRequestWorkflowPayload {
  name: string;
  description?: string;
  estateId: string;
  steps: WorkflowStep[];
}

function normalizeApproverType(raw: unknown): ApproverType {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "users") return "user";
  if ((APPROVER_TYPES as readonly string[]).includes(value)) {
    return value as ApproverType;
  }
  return "estate_admin";
}

function normalizeApprovalMode(raw: unknown): ApprovalMode {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return value === "all" ? "all" : "any";
}

export function normalizeWorkflowStep(
  raw: Record<string, unknown>,
  index = 0,
): WorkflowStep {
  const userIds = Array.isArray(raw.userIds)
    ? raw.userIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  return {
    order: Number(raw.order ?? index + 1) || index + 1,
    name: String(raw.name ?? "").trim(),
    approverType: normalizeApproverType(raw.approverType),
    userIds,
    approvalMode: normalizeApprovalMode(raw.approvalMode),
    allowReject: raw.allowReject !== false,
    reminderEnabled: Boolean(raw.reminderEnabled),
    reminderIntervalHours:
      raw.reminderIntervalHours != null
        ? Number(raw.reminderIntervalHours)
        : 24,
    reminderMaxCount:
      raw.reminderMaxCount != null ? Number(raw.reminderMaxCount) : 3,
  };
}

export function normalizeRequestWorkflow(
  raw: Record<string, unknown> | null | undefined,
): RequestWorkflow | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw._id ?? raw.id ?? "").trim() || undefined;
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = stepsRaw.map((step, index) =>
    normalizeWorkflowStep(
      (step && typeof step === "object"
        ? step
        : {}) as Record<string, unknown>,
      index,
    ),
  );

  return {
    id,
    _id: id,
    name: String(raw.name ?? "").trim(),
    description: raw.description
      ? String(raw.description).trim()
      : undefined,
    estateId: String(raw.estateId ?? "").trim(),
    steps,
    isActive: raw.isActive as boolean | undefined,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  };
}

/** Parse GET /api/v1/requests/workflows — one object or a list. */
export function extractWorkflowList(data: unknown): RequestWorkflow[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const nested = "data" in root ? root.data : root;
  if (nested == null) return [];

  let candidates: unknown[] = [];
  if (Array.isArray(nested)) {
    candidates = nested;
  } else if (typeof nested === "object") {
    const obj = nested as Record<string, unknown>;
    if (Array.isArray(obj.items)) candidates = obj.items;
    else if (Array.isArray(obj.workflows)) candidates = obj.workflows;
    else candidates = [obj];
  }

  return candidates
    .map((item) =>
      normalizeRequestWorkflow(
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : null,
      ),
    )
    .filter((workflow): workflow is RequestWorkflow => Boolean(workflow?.name));
}

function extractWorkflowPayload(data: unknown): RequestWorkflow | null {
  return extractWorkflowList(data)[0] ?? null;
}

export function createEmptyWorkflowStep(order = 1): WorkflowStep {
  return {
    order,
    name: "",
    approverType: "estate_admin",
    userIds: [],
    approvalMode: "any",
    allowReject: true,
    reminderEnabled: false,
    reminderIntervalHours: 24,
    reminderMaxCount: 3,
  };
}

/** GET /api/v1/requests/workflows?estateId= — active workflow for an estate */
export const getAdminRequestWorkflow = createAsyncThunk(
  "adminRequest/getWorkflow",
  async (estateId: string, { rejectWithValue }) => {
    const trimmed = estateId?.trim();
    if (!trimmed) {
      return rejectWithValue({ message: "Estate is required." });
    }

    try {
      const res = await axiosInstance.get("/api/v1/requests/workflows", {
        params: { estateId: trimmed },
      });
      return extractWorkflowPayload(res.data);
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      // No workflow configured yet
      if (err?.response?.status === 404) {
        return null;
      }
      return rejectWithValue({
        message:
          err?.response?.data?.message ??
          "Failed to fetch request workflow",
      });
    }
  },
);

/** PUT /api/v1/requests/workflows — create or replace active workflow */
export const upsertAdminRequestWorkflow = createAsyncThunk(
  "adminRequest/upsertWorkflow",
  async (payload: UpsertRequestWorkflowPayload, { rejectWithValue }) => {
    const name = payload.name?.trim();
    const estateId = payload.estateId?.trim();
    const steps = Array.isArray(payload.steps) ? payload.steps : [];

    if (!name) {
      return rejectWithValue({ message: "Workflow name is required." });
    }
    if (!estateId) {
      return rejectWithValue({ message: "Estate is required." });
    }
    if (steps.length === 0) {
      return rejectWithValue({
        message: "Add at least one approval step.",
      });
    }

    for (const [index, step] of steps.entries()) {
      if (!step.name?.trim()) {
        return rejectWithValue({
          message: `Step ${index + 1}: name is required.`,
        });
      }
      if (step.approverType === "user" && (step.userIds?.length ?? 0) <= 0) {
        return rejectWithValue({
          message: `Step ${index + 1}: add at least one user ID for specific user.`,
        });
      }
    }

    try {
      const body = {
        name,
        description: payload.description?.trim() || undefined,
        estateId,
        steps: steps.map((step, index) => ({
          order: index + 1,
          name: step.name.trim(),
          approverType: step.approverType,
          userIds:
            step.approverType === "user"
              ? (step.userIds ?? []).map((id) => id.trim()).filter(Boolean)
              : undefined,
          approvalMode: step.approvalMode,
          allowReject: Boolean(step.allowReject),
          reminderEnabled: Boolean(step.reminderEnabled),
          reminderIntervalHours: step.reminderEnabled
            ? Number(step.reminderIntervalHours) || 24
            : undefined,
          reminderMaxCount: step.reminderEnabled
            ? Number(step.reminderMaxCount) || 3
            : undefined,
        })),
      };

      const res = await axiosInstance.put("/api/v1/requests/workflows", body);
      return (
        extractWorkflowPayload(res.data) ??
        normalizeRequestWorkflow({
          ...body,
          ...(res.data?.data && typeof res.data.data === "object"
            ? (res.data.data as Record<string, unknown>)
            : {}),
        })
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = err?.response?.data?.message;
      return rejectWithValue({
        message: Array.isArray(msg)
          ? msg[0]
          : (msg ?? "Failed to save request workflow"),
      });
    }
  },
);
