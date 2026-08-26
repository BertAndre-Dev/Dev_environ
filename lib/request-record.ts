import { isSameUserId, normalizeUserId } from "@/lib/user-id";

export interface RequestRecordField {
  key: string;
  label?: string;
  type?: string;
  value: string;
}

export interface RequestStepRecipient {
  userId?: string;
  email?: string;
  phoneNumber?: string;
  name?: string;
}

export interface RequestWorkflowStep {
  order?: number;
  name?: string;
  status?: string;
  approverType?: string;
  approvalMode?: string;
  assignedTo?: string[];
  assignedRecipients?: RequestStepRecipient[];
  approvedBy?: string[];
  allowReject?: boolean;
}

function asTrimmedString(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const value = String(raw).trim();
  return value || undefined;
}

export function parseRequestFieldValues(raw: unknown): RequestRecordField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): RequestRecordField | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const key = asTrimmedString(item.key);
      const value =
        item.value == null ? "" : String(item.value);
      if (!key && !value) return null;
      return {
        key: key ?? "",
        label: asTrimmedString(item.label),
        type: asTrimmedString(item.type),
        value,
      };
    })
    .filter((field): field is RequestRecordField => Boolean(field));
}

function parseAssignedRecipients(raw: unknown): RequestStepRecipient[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): RequestStepRecipient | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const userId = normalizeUserId(item.userId ?? item.id ?? item._id);
      return {
        userId: userId || undefined,
        email: asTrimmedString(item.email),
        phoneNumber: asTrimmedString(item.phoneNumber),
        name: asTrimmedString(item.name),
      };
    })
    .filter((recipient): recipient is RequestStepRecipient => {
      if (!recipient) return false;
      return Boolean(
        recipient.userId ||
          recipient.email ||
          recipient.phoneNumber ||
          recipient.name,
      );
    });
}

export function parseRequestSteps(raw: unknown): RequestWorkflowStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): RequestWorkflowStep | null => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const assignedTo = Array.isArray(item.assignedTo)
        ? item.assignedTo
            .map((id) => normalizeUserId(id))
            .filter(Boolean)
        : undefined;
      const approvedBy = Array.isArray(item.approvedBy)
        ? item.approvedBy
            .map((id) => normalizeUserId(id))
            .filter(Boolean)
        : undefined;
      return {
        order: item.order != null ? Number(item.order) : undefined,
        name: asTrimmedString(item.name),
        status: asTrimmedString(item.status),
        approverType: asTrimmedString(item.approverType),
        approvalMode: asTrimmedString(item.approvalMode),
        assignedTo,
        assignedRecipients: parseAssignedRecipients(item.assignedRecipients),
        approvedBy,
        allowReject:
          item.allowReject == null ? undefined : Boolean(item.allowReject),
      };
    })
    .filter((step): step is RequestWorkflowStep => Boolean(step));
}

export function getCurrentRequestStep(item: {
  currentStepOrder?: number;
  steps?: RequestWorkflowStep[];
}): RequestWorkflowStep | undefined {
  const steps = item.steps ?? [];
  if (item.currentStepOrder != null) {
    const currentOrder = Number(item.currentStepOrder);
    const byOrder = steps.find(
      (step) => step.order != null && Number(step.order) === currentOrder,
    );
    if (byOrder) return byOrder;
  }
  return steps.find(
    (step) => (step.status ?? "").toLowerCase() === "pending",
  );
}

export function resolveCurrentStepName(item: {
  currentStepName?: string;
  currentStepOrder?: number;
  steps?: RequestWorkflowStep[];
}): string | undefined {
  const explicit = item.currentStepName?.trim();
  if (explicit) return explicit;
  const step = getCurrentRequestStep(item);
  if (step?.name?.trim()) return step.name.trim();
  if (item.currentStepOrder != null) return `Step ${item.currentStepOrder}`;
  return undefined;
}

export function formatStepAssignees(step?: RequestWorkflowStep): string {
  if (!step) return "—";
  const names = (step.assignedRecipients ?? [])
    .map((recipient) => recipient.name?.trim() || recipient.email?.trim())
    .filter(Boolean);
  if (names.length > 0) return names.join(", ");
  return "—";
}

export function isUserAssignedToCurrentStep(
  item: {
    currentStepOrder?: number;
    steps?: RequestWorkflowStep[];
  },
  userId: string | string[] | null | undefined,
  email?: string | null,
): boolean {
  const ids = (Array.isArray(userId) ? userId : [userId])
    .map((id) => normalizeUserId(id))
    .filter(Boolean);
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  if (ids.length === 0 && !normalizedEmail) return false;

  const step = getCurrentRequestStep(item);
  if (!step) return false;

  if (
    (step.assignedTo ?? []).some((id) =>
      ids.some((uid) => isSameUserId(id, uid)),
    )
  ) {
    return true;
  }

  return (step.assignedRecipients ?? []).some((recipient) => {
    if (ids.some((uid) => isSameUserId(recipient.userId, uid))) return true;
    const recipientEmail = recipient.email?.trim().toLowerCase();
    return Boolean(
      normalizedEmail && recipientEmail && recipientEmail === normalizedEmail,
    );
  });
}

export function currentStepAllowsReject(item: {
  currentStepOrder?: number;
  steps?: RequestWorkflowStep[];
}): boolean {
  const step = getCurrentRequestStep(item);
  return step?.allowReject !== false;
}

export function isFileRequestField(field: RequestRecordField): boolean {
  const type = (field.type ?? "").toLowerCase();
  if (type === "file" || type === "attachment") return true;
  const value = field.value.trim();
  if (!/^https?:\/\//i.test(value)) return false;
  const path = value.split("?")[0] ?? "";
  return /\.(pdf|png|jpe?g|webp|gif|docx?|xlsx?|csv)$/i.test(path);
}
