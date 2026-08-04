import { createAsyncThunk } from "@reduxjs/toolkit";
// Temporarily disabled — notifications API
// import axiosInstance from "@/utils/axiosInstance";

export type NotificationStatus = string;

export interface NotificationItem {
  id: string;
  _id?: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: NotificationStatus;
  estateId?: string;
  actionUrl?: string;
  channels?: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  isSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sentAt?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface NotificationsListPayload {
  success?: boolean;
  message?: string;
  data: NotificationItem[];
  total: number;
  pages: number;
  unreadCount: number;
  page?: number;
  limit?: number;
}

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown };
    if (obj._id != null) return asString(obj._id, fallback);
    if (obj.id != null) return asString(obj.id, fallback);
  }
  return fallback;
}

/** Unwrap Mongoose-style docs (`_doc`) or plain objects into a flat record. */
export function unwrapNotificationRaw(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  if (obj._doc && typeof obj._doc === "object") {
    return obj._doc as Record<string, unknown>;
  }
  return obj;
}

export function normalizeNotification(raw: unknown): NotificationItem {
  const p = unwrapNotificationRaw(raw);
  const id = asString(p._id ?? p.id);
  return {
    id,
    _id: id,
    userId: p.userId != null ? asString(p.userId) : undefined,
    type: asString(p.type),
    title: asString(p.title),
    message: asString(p.message),
    priority: asString(p.priority, "normal"),
    status: asString(p.status, "unread"),
    estateId: p.estateId != null ? asString(p.estateId) : undefined,
    actionUrl: typeof p.actionUrl === "string" ? p.actionUrl : undefined,
    channels: Array.isArray(p.channels)
      ? p.channels.map((c) => asString(c))
      : undefined,
    relatedEntityId:
      p.relatedEntityId != null ? asString(p.relatedEntityId) : undefined,
    relatedEntityType:
      typeof p.relatedEntityType === "string"
        ? p.relatedEntityType
        : undefined,
    isSent: typeof p.isSent === "boolean" ? p.isSent : undefined,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : undefined,
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
    sentAt: typeof p.sentAt === "string" ? p.sentAt : undefined,
  };
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message ?? fallback;
}

/** GET /api/v1/notifications — temporarily disabled */
export const getNotifications = createAsyncThunk(
  "notifications/getNotifications",
  async (_params: GetNotificationsParams | undefined, { rejectWithValue }) => {
    return rejectWithValue("Notifications are temporarily disabled");
    // const opts = params ?? {};
    // try {
    //   const query: Record<string, string | number> = {
    //     page: opts.page ?? 1,
    //     limit: opts.limit ?? 20,
    //   };
    //   if (opts.status?.trim()) query.status = opts.status.trim();
    //   if (opts.type?.trim()) query.type = opts.type.trim();
    //   if (opts.priority?.trim()) query.priority = opts.priority.trim();
    //   if (opts.sortBy?.trim()) query.sortBy = opts.sortBy.trim();
    //   if (opts.sortOrder?.trim()) query.sortOrder = opts.sortOrder.trim();
    //
    //   const res = await axiosInstance.get("/api/v1/notifications", {
    //     params: query,
    //   });
    //   const body = res.data as Record<string, unknown>;
    //   const rawList = Array.isArray(body?.data) ? body.data : [];
    //   const list = rawList.map(normalizeNotification);
    //   const total =
    //     typeof body.total === "number" ? body.total : list.length;
    //   const pages =
    //     typeof body.pages === "number"
    //       ? body.pages
    //       : Math.max(1, Math.ceil(total / (opts.limit ?? 20)));
    //   const unreadCount =
    //     typeof body.unreadCount === "number" ? body.unreadCount : 0;
    //
    //   return {
    //     success: body.success as boolean | undefined,
    //     message: body.message as string | undefined,
    //     data: list,
    //     total,
    //     pages,
    //     unreadCount,
    //     page: opts.page ?? 1,
    //     limit: opts.limit ?? 20,
    //   } satisfies NotificationsListPayload;
    // } catch (error: unknown) {
    //   return rejectWithValue(
    //     extractErrorMessage(error, "Failed to fetch notifications"),
    //   );
    // }
  },
);

/** GET /api/v1/notifications/{notificationId} — temporarily disabled */
export const getNotificationById = createAsyncThunk(
  "notifications/getNotificationById",
  async (_notificationId: string, { rejectWithValue }) => {
    return rejectWithValue("Notifications are temporarily disabled");
    // try {
    //   const res = await axiosInstance.get(
    //     `/api/v1/notifications/${notificationId}`,
    //   );
    //   const body = res.data as Record<string, unknown>;
    //   const raw = body?.data ?? body;
    //   return normalizeNotification(raw);
    // } catch (error: unknown) {
    //   return rejectWithValue(
    //     extractErrorMessage(error, "Failed to fetch notification"),
    //   );
    // }
  },
);

/** PUT /api/v1/notifications/{notificationId}/read — temporarily disabled */
export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (_notificationId: string, { rejectWithValue }) => {
    return rejectWithValue("Notifications are temporarily disabled");
    // try {
    //   const res = await axiosInstance.put(
    //     `/api/v1/notifications/${notificationId}/read`,
    //   );
    //   const body = res.data as Record<string, unknown>;
    //   const raw = body?.data;
    //   if (raw) {
    //     return normalizeNotification(raw);
    //   }
    //   return { id: notificationId, status: "read" as const };
    // } catch (error: unknown) {
    //   return rejectWithValue(
    //     extractErrorMessage(error, "Failed to mark notification as read"),
    //   );
    // }
  },
);

/** PUT /api/v1/notifications/read/multiple — temporarily disabled */
export const markNotificationsReadMultiple = createAsyncThunk(
  "notifications/markNotificationsReadMultiple",
  async (_notificationIds: string[], { rejectWithValue }) => {
    return rejectWithValue("Notifications are temporarily disabled");
    // try {
    //   const ids = notificationIds.filter(Boolean);
    //   await axiosInstance.put("/api/v1/notifications/read/multiple", {
    //     notificationIds: ids,
    //   });
    //   return { notificationIds: ids };
    // } catch (error: unknown) {
    //   return rejectWithValue(
    //     extractErrorMessage(
    //       error,
    //       "Failed to mark notifications as read",
    //     ),
    //   );
    // }
  },
);
