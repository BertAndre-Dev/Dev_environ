import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  enrichRequestItemsWithActorNames,
  normalizeRequestActor,
  resolveCreatedByFromRaw,
  type RequestActor,
} from "@/lib/request-actor";
import axiosInstance from "@/utils/axiosInstance";

export const ESTATE_ADMIN_REQUEST_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type EstateAdminRequestStatus = (typeof ESTATE_ADMIN_REQUEST_STATUSES)[number];

export const ESTATE_ADMIN_REQUEST_STATUS_OPTIONS: {
  value: EstateAdminRequestStatus | "";
  label: string;
}[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export type EstateAdminRequestDecision = "approve" | "reject";

export type EstateAdminRequestActor = RequestActor;

export interface EstateAdminRequestStepDecision {
  stepOrder?: number;
  decision?: string;
  comment?: string;
  decidedBy?: string | EstateAdminRequestActor;
  decidedAt?: string;
}

export interface EstateAdminRequestWorkflowStepSnapshot {
  order?: number;
  name?: string;
  approverType?: string;
  status?: string;
}

export interface EstateAdminRequestItem {
  id: string;
  _id?: string;
  code?: string;
  title: string;
  description?: string;
  category?: string;
  estateId?: string;
  attachments?: string[];
  workflowId?: string;
  status?: EstateAdminRequestStatus;
  currentStepOrder?: number;
  currentStepName?: string;
  steps?: EstateAdminRequestWorkflowStepSnapshot[];
  decisions?: EstateAdminRequestStepDecision[];
  createdBy?: string | EstateAdminRequestActor;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListEstateAdminRequestsParams {
  estateId: string;
  status?: EstateAdminRequestStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}

export interface DecideEstateAdminRequestPayload {
  id: string;
  decision: EstateAdminRequestDecision;
  comment?: string;
  estateId?: string;
}

export interface GetEstateAdminRequestByIdPayload {
  id: string;
  estateId?: string;
}

export interface CancelEstateAdminRequestPayload {
  id: string;
  estateId?: string;
}

interface EstateAdminRequestsListResponse {
  success?: boolean;
  data?:
    | EstateAdminRequestItem[]
    | {
        items?: EstateAdminRequestItem[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages?: number;
        };
      };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages?: number;
  };
  message?: string;
}

function normalizeStatus(raw: unknown): EstateAdminRequestStatus {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return (ESTATE_ADMIN_REQUEST_STATUSES as readonly string[]).includes(value)
    ? (value as EstateAdminRequestStatus)
    : "pending_approval";
}

function extractList(payload: EstateAdminRequestsListResponse | undefined): EstateAdminRequestItem[] {
  const dataBlock = payload?.data;
  if (Array.isArray(dataBlock)) return dataBlock;
  if (dataBlock && Array.isArray(dataBlock.items)) return dataBlock.items;
  return [];
}

function extractPagination(payload: EstateAdminRequestsListResponse | undefined) {
  const nested =
    payload?.data && !Array.isArray(payload.data)
      ? payload.data.pagination
      : undefined;
  return (
    nested ??
    payload?.pagination ?? {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1,
    }
  );
}

function normalizeDecision(raw: unknown): EstateAdminRequestStepDecision | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    stepOrder:
      item.stepOrder != null ? Number(item.stepOrder) : undefined,
    decision: item.decision != null ? String(item.decision) : undefined,
    comment: item.comment != null ? String(item.comment) : undefined,
    decidedBy: normalizeRequestActor(item.decidedBy),
    decidedAt:
      item.decidedAt != null ? String(item.decidedAt) : undefined,
  };
}

function normalizeStepSnapshot(
  raw: unknown,
): EstateAdminRequestWorkflowStepSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    order: item.order != null ? Number(item.order) : undefined,
    name: item.name != null ? String(item.name) : undefined,
    approverType:
      item.approverType != null ? String(item.approverType) : undefined,
    status: item.status != null ? String(item.status) : undefined,
  };
}

export function normalizeEstateAdminRequestItem(
  raw: Record<string, unknown>,
): EstateAdminRequestItem {
  const id = String(raw._id ?? raw.id ?? "");
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : [];
  const decisionsRaw = Array.isArray(raw.decisions)
    ? raw.decisions
    : Array.isArray(raw.history)
      ? raw.history
      : [];

  const currentStep =
    raw.currentStep && typeof raw.currentStep === "object"
      ? (raw.currentStep as Record<string, unknown>)
      : null;

  return {
    id,
    _id: id,
    code: raw.code != null ? String(raw.code).trim() || undefined : undefined,
    title: String(raw.title ?? ""),
    description:
      raw.description != null ? String(raw.description) : undefined,
    category: raw.category != null ? String(raw.category) : undefined,
    estateId: raw.estateId != null ? String(raw.estateId) : undefined,
    attachments: Array.isArray(raw.attachments)
      ? raw.attachments.map((url) => String(url))
      : undefined,
    workflowId:
      raw.workflowId != null ? String(raw.workflowId) : undefined,
    status: normalizeStatus(raw.status),
    currentStepOrder:
      raw.currentStepOrder != null
        ? Number(raw.currentStepOrder)
        : currentStep?.order != null
          ? Number(currentStep.order)
          : undefined,
    currentStepName:
      raw.currentStepName != null
        ? String(raw.currentStepName)
        : currentStep?.name != null
          ? String(currentStep.name)
          : undefined,
    steps: stepsRaw
      .map(normalizeStepSnapshot)
      .filter((s): s is EstateAdminRequestWorkflowStepSnapshot => Boolean(s)),
    decisions: decisionsRaw
      .map(normalizeDecision)
      .filter((d): d is EstateAdminRequestStepDecision => Boolean(d)),
    createdBy: resolveCreatedByFromRaw(raw),
    createdAt: raw.createdAt != null ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
  };
}

function extractRequestPayload(data: unknown): EstateAdminRequestItem | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const nested = root.data;

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return normalizeEstateAdminRequestItem(nested as Record<string, unknown>);
  }
  if (Array.isArray(nested) && nested[0] && typeof nested[0] === "object") {
    return normalizeEstateAdminRequestItem(nested[0] as Record<string, unknown>);
  }
  if (root.id != null || root._id != null || root.title != null) {
    return normalizeEstateAdminRequestItem(root);
  }
  return null;
}

/** GET /api/v1/requests — list estate requests */
export const getEstateAdminRequests = createAsyncThunk(
  "estateAdminRequest/getList",
  async (params: ListEstateAdminRequestsParams, { rejectWithValue }) => {
    try {
      const { estateId, status, search, page = 1, limit = 10 } = params;
      if (!estateId?.trim()) {
        return rejectWithValue({ message: "Estate is required." });
      }

      const query: Record<string, string | number> = {
        estateId: estateId.trim(),
        page,
        limit,
      };
      if (status?.trim()) query.status = status.trim();
      if (search?.trim()) query.search = search.trim();

      const res = await axiosInstance.get<EstateAdminRequestsListResponse>(
        "/api/v1/requests",
        { params: query },
      );

      const list = await enrichRequestItemsWithActorNames(
        extractList(res.data).map((item) =>
          normalizeEstateAdminRequestItem(
            item as unknown as Record<string, unknown>,
          ),
        ),
      );
      const pagination = extractPagination(res.data);

      return { list, pagination };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch requests",
      });
    }
  },
);

/** GET /api/v1/requests/{id}?estateId= — get a request by ID */
export const getEstateAdminRequestById = createAsyncThunk(
  "estateAdminRequest/getById",
  async (payload: GetEstateAdminRequestByIdPayload, { rejectWithValue }) => {
    const requestId = payload.id?.trim();
    const estateId = payload.estateId?.trim();
    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }

    try {
      const res = await axiosInstance.get(`/api/v1/requests/${requestId}`, {
        params: estateId ? { estateId } : undefined,
      });
      const item = extractRequestPayload(res.data);
      if (!item?.id) {
        return rejectWithValue({ message: "Request not found." });
      }
      const [enriched] = await enrichRequestItemsWithActorNames([item]);
      return enriched ?? item;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to fetch request details",
      });
    }
  },
);

/** POST /api/v1/requests/{id}/decide — approve or reject the current step */
export const decideEstateAdminRequest = createAsyncThunk(
  "estateAdminRequest/decide",
  async (payload: DecideEstateAdminRequestPayload, { rejectWithValue }) => {
    const id = payload.id?.trim();
    const decision = payload.decision;
    const comment = payload.comment?.trim() ?? "";

    if (!id) {
      return rejectWithValue({ message: "Request id is required." });
    }
    if (decision !== "approve" && decision !== "reject") {
      return rejectWithValue({ message: "Decision must be approve or reject." });
    }
    if (decision === "reject" && comment.length < 3) {
      return rejectWithValue({
        message: "A rejection reason of at least 3 characters is required.",
      });
    }

    try {
      const body: Record<string, string> = { decision };
      if (comment) body.comment = comment;
      const estateId = payload.estateId?.trim();

      const res = await axiosInstance.post(
        `/api/v1/requests/${id}/decide`,
        body,
        { params: estateId ? { estateId } : undefined },
      );
      return {
        id,
        decision,
        data: res.data,
        item: extractRequestPayload(res.data),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to submit decision",
      });
    }
  },
);

/** POST /api/v1/requests/{id}/cancel — cancel a pending request */
export const cancelEstateAdminRequest = createAsyncThunk(
  "estateAdminRequest/cancel",
  async (payload: CancelEstateAdminRequestPayload, { rejectWithValue }) => {
    const requestId = payload.id?.trim();
    const estateId = payload.estateId?.trim();
    if (!requestId) {
      return rejectWithValue({ message: "Request id is required." });
    }

    try {
      const res = await axiosInstance.post(
        `/api/v1/requests/${requestId}/cancel`,
        estateId ? { estateId } : {},
        { params: estateId ? { estateId } : undefined },
      );
      return {
        id: requestId,
        data: res.data,
        item: extractRequestPayload(res.data),
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return rejectWithValue({
        message:
          err?.response?.data?.message ?? "Failed to cancel request",
      });
    }
  },
);
