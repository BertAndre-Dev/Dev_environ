"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ChatGroup, GroupMessage } from "@/types/community-group";
import type { ChatPagination } from "@/types/chat";
import {
  addGroupMembers,
  createChatGroup,
  deleteChatGroup,
  deleteGroupMessage,
  editGroupMessage,
  getChatGroupById,
  getChatGroups,
  getGroupMessages,
  promoteGroupAdmin,
  removeGroupMembers,
  replyToGroupMessage,
  sendGroupMessage,
  updateChatGroup,
} from "@/redux/slice/estate-admin/community-group/community-group-thunks";

type LoadingState = "idle" | "isLoading" | "succeeded" | "failed";

interface EstateAdminCommunityGroupState {
  groups: ChatGroup[];
  listLoading: LoadingState;
  listPagination: ChatPagination | null;

  groupDetail: ChatGroup | null;
  detailLoading: LoadingState;

  createLoading: LoadingState;
  updateLoading: LoadingState;
  deleteLoading: LoadingState;

  activeMessagesGroupId: string | null;
  groupMessages: GroupMessage[];
  messagesLoading: LoadingState;
  messagesPagination: ChatPagination | null;
  sendMessageLoading: LoadingState;
  editMessageLoading: LoadingState;
  deleteMessageLoading: LoadingState;
  membersActionLoading: LoadingState;

  error: string | null;
}

const initialPagination: ChatPagination = {
  total: 0,
  page: 1,
  limit: 50,
  pages: 0,
};

const initialState: EstateAdminCommunityGroupState = {
  groups: [],
  listLoading: "idle",
  listPagination: null,

  groupDetail: null,
  detailLoading: "idle",

  createLoading: "idle",
  updateLoading: "idle",
  deleteLoading: "idle",

  activeMessagesGroupId: null,
  groupMessages: [],
  messagesLoading: "idle",
  messagesPagination: initialPagination,
  sendMessageLoading: "idle",
  editMessageLoading: "idle",
  deleteMessageLoading: "idle",
  membersActionLoading: "idle",

  error: null,
};

function upsertGroup(list: ChatGroup[], g: ChatGroup): ChatGroup[] {
  const idx = list.findIndex((x) => x._id === g._id);
  if (idx === -1) return [g, ...list];
  const next = list.slice();
  next[idx] = { ...next[idx], ...g };
  return next;
}

function sortMessagesAsc(list: GroupMessage[]): GroupMessage[] {
  return [...list].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

const estateAdminCommunityGroupSlice = createSlice({
  name: "estateAdminCommunityGroup",
  initialState,
  reducers: {
    clearGroupDetail: (state) => {
      state.groupDetail = null;
      state.detailLoading = "idle";
    },
    clearCommunityGroupError: (state) => {
      state.error = null;
    },
    clearGroups: (state) => {
      state.groups = [];
      state.listPagination = null;
    },
    clearGroupMessages: (state) => {
      state.groupMessages = [];
      state.activeMessagesGroupId = null;
      state.messagesPagination = initialPagination;
      state.messagesLoading = "idle";
    },
    patchLocalGroup: (
      state,
      action: PayloadAction<{ groupId: string; partial: Partial<ChatGroup> }>,
    ) => {
      const { groupId, partial } = action.payload;
      state.groups = state.groups.map((g) =>
        g._id === groupId ? { ...g, ...partial } : g,
      );
      if (state.groupDetail?._id === groupId) {
        state.groupDetail = { ...state.groupDetail, ...partial };
      }
    },

  },
  extraReducers: (builder) => {
    builder
      // ===== createChatGroup =====
      .addCase(createChatGroup.pending, (state) => {
        state.createLoading = "isLoading";
        state.error = null;
      })
      .addCase(createChatGroup.fulfilled, (state, action) => {
        state.createLoading = "succeeded";
        const group = action.payload.data;
        state.groups = upsertGroup(state.groups, group);
        state.groupDetail = group;
      })
      .addCase(createChatGroup.rejected, (state, action) => {
        state.createLoading = "failed";
        state.error = action.payload?.message ?? "Failed to create group.";
      })

      // ===== getChatGroups =====
      .addCase(getChatGroups.pending, (state) => {
        state.listLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatGroups.fulfilled, (state, action) => {
        state.listLoading = "succeeded";
        state.groups = action.payload.data;
        state.listPagination = action.payload.pagination ?? null;
      })
      .addCase(getChatGroups.rejected, (state, action) => {
        state.listLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load groups.";
      })

      // ===== getChatGroupById =====
      .addCase(getChatGroupById.pending, (state) => {
        state.detailLoading = "isLoading";
        state.error = null;
      })
      .addCase(getChatGroupById.fulfilled, (state, action) => {
        state.detailLoading = "succeeded";
        const group = action.payload.data;
        state.groupDetail = group;
        state.groups = upsertGroup(state.groups, group);
      })
      .addCase(getChatGroupById.rejected, (state, action) => {
        state.detailLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load group.";
      })

      // ===== updateChatGroup =====
      .addCase(updateChatGroup.pending, (state) => {
        state.updateLoading = "isLoading";
        state.error = null;
      })
      .addCase(updateChatGroup.fulfilled, (state, action) => {
        state.updateLoading = "succeeded";
        const group = action.payload.data;
        state.groups = upsertGroup(state.groups, group);
        if (state.groupDetail?._id === group._id) state.groupDetail = group;
      })
      .addCase(updateChatGroup.rejected, (state, action) => {
        state.updateLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update group.";
      })

      // ===== deleteChatGroup =====
      .addCase(deleteChatGroup.pending, (state) => {
        state.deleteLoading = "isLoading";
        state.error = null;
      })
      .addCase(deleteChatGroup.fulfilled, (state, action) => {
        state.deleteLoading = "succeeded";
        const groupId = action.meta.arg.groupId;
        state.groups = state.groups.filter((g) => g._id !== groupId);
        if (state.groupDetail?._id === groupId) state.groupDetail = null;
      })
      .addCase(deleteChatGroup.rejected, (state, action) => {
        state.deleteLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete group.";
      })

      // ===== members actions =====
      .addCase(addGroupMembers.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(addGroupMembers.fulfilled, (state, action) => {
        state.membersActionLoading = "succeeded";
        // Endpoint returns no group payload; refresh list/detail if needed.
        void action;
      })
      .addCase(addGroupMembers.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update members.";
      })
      .addCase(removeGroupMembers.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(removeGroupMembers.fulfilled, (state, action) => {
        state.membersActionLoading = "succeeded";
        void action;
      })
      .addCase(removeGroupMembers.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update members.";
      })
      .addCase(promoteGroupAdmin.pending, (state) => {
        state.membersActionLoading = "isLoading";
        state.error = null;
      })
      .addCase(promoteGroupAdmin.fulfilled, (state, action) => {
        state.membersActionLoading = "succeeded";
        void action;
      })
      .addCase(promoteGroupAdmin.rejected, (state, action) => {
        state.membersActionLoading = "failed";
        state.error = action.payload?.message ?? "Failed to update admins.";
      })

      // ===== getGroupMessages =====
      .addCase(getGroupMessages.pending, (state, action) => {
        state.messagesLoading = "isLoading";
        state.error = null;
        state.activeMessagesGroupId = action.meta.arg.groupId;
      })
      .addCase(getGroupMessages.fulfilled, (state, action) => {
        state.messagesLoading = "succeeded";
        const page = action.meta.arg.page ?? 1;
        state.messagesPagination = action.payload.pagination ?? initialPagination;
        if (page <= 1) {
          state.groupMessages = action.payload.data;
        } else {
          state.groupMessages = [...action.payload.data, ...state.groupMessages];
        }
        state.groupMessages = sortMessagesAsc(state.groupMessages);
      })
      .addCase(getGroupMessages.rejected, (state, action) => {
        state.messagesLoading = "failed";
        state.error = action.payload?.message ?? "Failed to load messages.";
      })

      // ===== sendGroupMessage =====
      .addCase(sendGroupMessage.pending, (state) => {
        state.sendMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(sendGroupMessage.fulfilled, (state, action) => {
        state.sendMessageLoading = "succeeded";
        const msg = action.payload.data;
        state.groupMessages = sortMessagesAsc([...state.groupMessages, msg]);
      })
      .addCase(sendGroupMessage.rejected, (state, action) => {
        state.sendMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to send message.";
      })

      // ===== replyToGroupMessage =====
      .addCase(replyToGroupMessage.pending, (state) => {
        state.sendMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(replyToGroupMessage.fulfilled, (state, action) => {
        state.sendMessageLoading = "succeeded";
        const msg = action.payload.data;
        state.groupMessages = sortMessagesAsc([...state.groupMessages, msg]);
      })
      .addCase(replyToGroupMessage.rejected, (state, action) => {
        state.sendMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to reply to message.";
      })

      // ===== editGroupMessage =====
      .addCase(editGroupMessage.pending, (state) => {
        state.editMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(editGroupMessage.fulfilled, (state, action) => {
        state.editMessageLoading = "succeeded";
        const updated = action.payload.data;
        state.groupMessages = sortMessagesAsc(
          state.groupMessages.map((m) => (m._id === updated._id ? updated : m)),
        );
      })
      .addCase(editGroupMessage.rejected, (state, action) => {
        state.editMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to edit message.";
      })

      // ===== deleteGroupMessage =====
      .addCase(deleteGroupMessage.pending, (state) => {
        state.deleteMessageLoading = "isLoading";
        state.error = null;
      })
      .addCase(deleteGroupMessage.fulfilled, (state, action) => {
        state.deleteMessageLoading = "succeeded";
        const id = action.meta.arg.messageId;
        state.groupMessages = state.groupMessages.map((m) =>
          m._id === id ? { ...m, isDeleted: true } : m,
        );
      })
      .addCase(deleteGroupMessage.rejected, (state, action) => {
        state.deleteMessageLoading = "failed";
        state.error = action.payload?.message ?? "Failed to delete message.";
      });
  },
});

export const {
  clearGroupDetail,
  clearCommunityGroupError,
  clearGroups,
  clearGroupMessages,
  patchLocalGroup,
} = estateAdminCommunityGroupSlice.actions;

export default estateAdminCommunityGroupSlice.reducer;

