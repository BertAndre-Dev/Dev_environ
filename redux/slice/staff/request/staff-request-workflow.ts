import { createAsyncThunk } from "@reduxjs/toolkit";
import { slugify } from "@/lib/slug";
import axiosInstance from "@/utils/axiosInstance";

export const APPROVAL_MODES = ["any", "all"] as const;
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export const APPROVAL_MODE_OPTIONS: { value: ApprovalMode; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "all", label: "All" },
];

export interface WorkflowStep {
  order: number;
  name: string;
  userIds?: string[];
  approvalMode: ApprovalMode;
  allowReject: boolean;
  reminderEnabled: boolean;
  reminderIntervalHours?: number;
  reminderMaxCount?: number;
}

export const WORKFLOW_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "select",
  "file",
] as const;

export type WorkflowFieldType = (typeof WORKFLOW_FIELD_TYPES)[number];

export const WORKFLOW_FIELD_TYPE_OPTIONS: {
  value: WorkflowFieldType;
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File" },
];

export interface RequestWorkflowField {
  key: string;
  label: string;
  type: WorkflowFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface RequestWorkflow {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  estateId: string;
  steps: WorkflowStep[];
  fields?: RequestWorkflowField[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertRequestWorkflowPayload {
  name: string;
  description?: string;
  estateId: string;
  steps: WorkflowStep[];
  fields?: RequestWorkflowField[];
  isActive?: boolean;
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
    userIds,
    approvalMode: normalizeApprovalMode(raw.approvalMode),
    allowReject: raw.allowReject !== false,
    reminderEnabled: Boolean(raw.reminderEnabled),
    reminderIntervalHours:
      raw.reminderIntervalHours != null
        ? Number(raw.reminderIntervalHours)
        : undefined,
    reminderMaxCount:
      raw.reminderMaxCount != null
        ? Number(raw.reminderMaxCount)
        : undefined,
  };
}

function normalizeWorkflowFieldType(raw: unknown): WorkflowFieldType {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return (WORKFLOW_FIELD_TYPES as readonly string[]).includes(value)
    ? (value as WorkflowFieldType)
    : "text";
}

function normalizeWorkflowFieldOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((option) => String(option ?? "").trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);
  }
  return [];
}

export function workflowFieldKeyFromLabel(label: string): string {
  return slugify(label).replace(/-/g, "_");
}

export function normalizeWorkflowField(
  raw: Record<string, unknown>,
  index = 0,
): RequestWorkflowField {
  const label = String(raw.label ?? "").trim();
  const key =
    String(raw.key ?? "").trim() ||
    workflowFieldKeyFromLabel(label) ||
    `field_${index + 1}`;

  return {
    key,
    label,
    type: normalizeWorkflowFieldType(raw.type),
    required: Boolean(raw.required),
    options: normalizeWorkflowFieldOptions(raw.options),
    placeholder: raw.placeholder
      ? String(raw.placeholder).trim()
      : undefined,
    helpText: raw.helpText ? String(raw.helpText).trim() : undefined,
  };
}

export function createEmptyWorkflowField(): RequestWorkflowField {
  return {
    key: "",
    label: "",
    type: "text",
    required: false,
    options: [],
    placeholder: "",
    helpText: "",
  };
}

export function assignUniqueWorkflowFieldKeys(
  fields: RequestWorkflowField[],
): RequestWorkflowField[] {
  const used = new Set<string>();
  return fields.map((field, index) => {
    const fromLabel = workflowFieldKeyFromLabel(field.label);
    let key = field.key.trim() || fromLabel || `field_${index + 1}`;
    const base = key;
    let suffix = 2;
    while (used.has(key)) {
      key = `${base}_${suffix}`;
      suffix += 1;
    }
    used.add(key);
    return { ...field, key };
  });
}

export function serializeWorkflowFields(
  fields: RequestWorkflowField[] | undefined,
): Array<{
  key: string;
  label: string;
  type: WorkflowFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}> {
  return assignUniqueWorkflowFieldKeys(fields ?? [])
    .filter((field) => field.label.trim())
    .map((field) => {
      const options =
        field.type === "select"
          ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
          : undefined;
      return {
        key: field.key,
        label: field.label.trim(),
        type: field.type,
        required: Boolean(field.required),
        options: options?.length ? options : undefined,
        placeholder: field.placeholder?.trim() || undefined,
        helpText: field.helpText?.trim() || undefined,
      };
    });
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
  const fieldsRaw = Array.isArray(raw.fields) ? raw.fields : [];
  const fields = fieldsRaw.map((field, index) =>
    normalizeWorkflowField(
      (field && typeof field === "object"
        ? field
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
    fields,
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
    userIds: [],
    approvalMode: "any",
    allowReject: true,
    reminderEnabled: false,
  };
}

/** GET /api/v1/requests/workflows?estateId= — workflows for an estate */
export const getStaffRequestWorkflow = createAsyncThunk(
  "staffRequestWorkflow/getWorkflow",
  async (estateId: string, { rejectWithValue }) => {
    const trimmed = estateId?.trim();
    if (!trimmed) {
      return rejectWithValue({ message: "Estate is required." });
    }

    try {
      const res = await axiosInstance.get("/api/v1/requests/workflows", {
        params: { estateId: trimmed },
      });
      return extractWorkflowList(res.data);
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err?.response?.status === 404) {
        return [] as RequestWorkflow[];
      }
      return rejectWithValue({
        message:
          err?.response?.data?.message ??
          "Failed to fetch request workflow",
      });
    }
  },
);

/** PUT /api/v1/requests/workflows — upsert by name (same name updates steps/settings; new name creates another workflow) */
export const upsertStaffRequestWorkflow = createAsyncThunk(
  "staffRequestWorkflow/upsertWorkflow",
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
      const userIds = (step.userIds ?? [])
        .map((id) => id.trim())
        .filter(Boolean);
      if (userIds.length <= 0) {
        return rejectWithValue({
          message: `Step ${index + 1}: select at least one user.`,
        });
      }
      if (step.reminderEnabled) {
        const interval = Number(step.reminderIntervalHours);
        const maxCount = Number(step.reminderMaxCount);
        if (!Number.isFinite(interval) || interval < 1) {
          return rejectWithValue({
            message: `Step ${index + 1}: reminder interval (hours) is required.`,
          });
        }
        if (!Number.isFinite(maxCount) || maxCount < 1) {
          return rejectWithValue({
            message: `Step ${index + 1}: max reminders is required.`,
          });
        }
      }
    }

    const fields = serializeWorkflowFields(payload.fields);
    for (const [index, field] of fields.entries()) {
      if (field.type === "select" && !(field.options ?? []).length) {
        return rejectWithValue({
          message: `Form field ${index + 1}: add at least one dropdown option.`,
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
          userIds: (step.userIds ?? []).map((id) => id.trim()).filter(Boolean),
          approvalMode: step.approvalMode,
          allowReject: Boolean(step.allowReject),
          reminderEnabled: Boolean(step.reminderEnabled),
          reminderIntervalHours: step.reminderEnabled
            ? Number(step.reminderIntervalHours)
            : undefined,
          reminderMaxCount: step.reminderEnabled
            ? Number(step.reminderMaxCount)
            : undefined,
        })),
        fields,
        isActive: payload.isActive ?? true,
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

/** DELETE /api/v1/requests/workflows/{id} — permanently delete a workflow */
export const deleteStaffRequestWorkflow = createAsyncThunk(
  "staffRequestWorkflow/deleteWorkflow",
  async (id: string, { rejectWithValue }) => {
    const workflowId = id?.trim();
    if (!workflowId) {
      return rejectWithValue({ message: "Workflow id is required." });
    }

    try {
      await axiosInstance.delete(`/api/v1/requests/workflows/${workflowId}`);
      return { id: workflowId };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to delete request workflow",
      });
    }
  },
);
