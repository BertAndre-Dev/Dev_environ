import { createSlice } from "@reduxjs/toolkit";
import {
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markNotificationsReadMultiple,
  type NotificationItem,
} from "./notifications";

export type { NotificationItem };

export type AsyncStatus = "idle" | "isLoading" | "succeeded" | "failed";

interface NotificationsState {
  list: NotificationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
  unreadCount: number;
  current: NotificationItem | null;
  getStatus: AsyncStatus;
  getByIdStatus: AsyncStatus;
  markReadStatus: AsyncStatus;
  markMultipleStatus: AsyncStatus;
  error: string | null;
}

const initialState: NotificationsState = {
  list: [],
  pagination: null,
  unreadCount: 0,
  current: null,
  getStatus: "idle",
  getByIdStatus: "idle",
  markReadStatus: "idle",
  markMultipleStatus: "idle",
  error: null,
};

function markItemsRead(
  list: NotificationItem[],
  ids: Set<string>,
): { list: NotificationItem[]; newlyRead: number } {
  let newlyRead = 0;
  const next = list.map((item) => {
    if (!ids.has(item.id)) return item;
    if ((item.status || "").toLowerCase() === "unread") {
      newlyRead += 1;
      return { ...item, status: "read" };
    }
    return { ...item, status: "read" };
  });
  return { list: next, newlyRead };
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationsError: (state) => {
      state.error = null;
    },
    resetNotificationsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getNotifications.pending, (state) => {
        state.getStatus = "isLoading";
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.getStatus = "succeeded";
        state.error = null;
        state.list = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page ?? 1,
          limit: action.payload.limit ?? 20,
          pages: action.payload.pages,
        };
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.getStatus = "failed";
        state.error =
          (action.payload as string) ?? "Failed to fetch notifications";
      })

      .addCase(getNotificationById.pending, (state) => {
        state.getByIdStatus = "isLoading";
        state.error = null;
      })
      .addCase(getNotificationById.fulfilled, (state, action) => {
        state.getByIdStatus = "succeeded";
        state.current = action.payload;
        const idx = state.list.findIndex((n) => n.id === action.payload.id);
        if (idx >= 0) {
          state.list[idx] = { ...state.list[idx], ...action.payload };
        }
      })
      .addCase(getNotificationById.rejected, (state, action) => {
        state.getByIdStatus = "failed";
        state.error =
          (action.payload as string) ?? "Failed to fetch notification";
      })

      .addCase(markNotificationRead.pending, (state) => {
        state.markReadStatus = "isLoading";
        state.error = null;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.markReadStatus = "succeeded";
        const id = action.payload.id;
        const { list, newlyRead } = markItemsRead(state.list, new Set([id]));
        state.list = list.map((item) =>
          item.id === id && "title" in action.payload && action.payload.title
            ? { ...item, ...action.payload, status: "read" }
            : item,
        );
        state.unreadCount = Math.max(0, state.unreadCount - newlyRead);
        if (state.current?.id === id) {
          state.current = { ...state.current, status: "read" };
        }
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.markReadStatus = "failed";
        state.error =
          (action.payload as string) ??
          "Failed to mark notification as read";
      })

      .addCase(markNotificationsReadMultiple.pending, (state) => {
        state.markMultipleStatus = "isLoading";
        state.error = null;
      })
      .addCase(markNotificationsReadMultiple.fulfilled, (state, action) => {
        state.markMultipleStatus = "succeeded";
        const ids = new Set(action.payload.notificationIds);
        const { list, newlyRead } = markItemsRead(state.list, ids);
        state.list = list;
        state.unreadCount = Math.max(0, state.unreadCount - newlyRead);
        if (state.current && ids.has(state.current.id)) {
          state.current = { ...state.current, status: "read" };
        }
      })
      .addCase(markNotificationsReadMultiple.rejected, (state, action) => {
        state.markMultipleStatus = "failed";
        state.error =
          (action.payload as string) ??
          "Failed to mark notifications as read";
      });
  },
});

export const { clearNotificationsError, resetNotificationsState } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
