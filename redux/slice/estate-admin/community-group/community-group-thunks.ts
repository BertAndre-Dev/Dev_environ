import { createAsyncThunk } from "@reduxjs/toolkit";

import axiosInstance from "@/utils/axiosInstance";
import type {
  AddGroupMembersPayload,
  ChatGroup,
  ChatGroupsListResponse,
  CreateChatGroupPayload,
  EditGroupMessagePayload,
  GroupMessage,
  GroupMessagesListResponse,
  PromoteGroupAdminPayload,
  RemoveGroupMembersPayload,
  ReplyToGroupMessagePayload,
  SendGroupMessagePayload,
  UpdateChatGroupPayload,
} from "@/types/community-group";

type RejectValue = { message: string };

type ApiResponse<T> = { success: boolean; data: T; message?: string };

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isValidObjectId(id: string): boolean {
  return OBJECT_ID_RE.test(id);
}

export function isValidEstateAdminCommunityObjectId(id: string): boolean {
  return isValidObjectId(id);
}

function invalidIdMessage(label: string): RejectValue {
  return { message: `Invalid ${label}.` };
}

type ApiPagination = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  totalPages?: number;
};

type ApiChatGroupMember = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ApiChatGroup = Omit<ChatGroup, "_id" | "members" | "admins"> & {
  id?: string;
  _id?: string;
  /** Legacy: string ids; current API: populated user objects. */
  members?: (string | ApiChatGroupMember)[];
  admins?: (string | ApiChatGroupMember)[];
  memberCount?: number;
  membersCount?: number;
};

function userIdFromMemberEntry(entry: unknown): string | null {
  if (typeof entry === "string") {
    const t = entry.trim();
    return t || null;
  }
  if (entry && typeof entry === "object") {
    const o = entry as ApiChatGroupMember;
    const id = (o.id ?? o._id ?? "").toString().trim();
    return id || null;
  }
  return null;
}

function normalizeChatGroup(raw: ApiChatGroup): ChatGroup {
  const _id = (raw._id ?? raw.id ?? "").toString();
  const members = Array.isArray(raw.members)
    ? raw.members
        .map(userIdFromMemberEntry)
        .filter((x): x is string => Boolean(x))
        .map((id) => ({ id }))
    : [];
  const admins = Array.isArray(raw.admins)
    ? raw.admins
        .map(userIdFromMemberEntry)
        .filter((x): x is string => Boolean(x))
    : [];
  const memberCountRaw =
    typeof raw.memberCount === "number"
      ? raw.memberCount
      : Number(raw.memberCount ?? raw.membersCount ?? 0) || 0;
  const memberCount = Math.max(memberCountRaw, members.length);

  return {
    ...(raw as unknown as Omit<ChatGroup, "_id" | "members" | "admins">),
    _id,
    members,
    admins,
    memberCount,
  };
}

function mergeCommunityApiPagination(
  p: ApiPagination,
  page: number,
  limit: number,
): { total: number; page: number; limit: number; pages: number } {
  const total = Number(p.total ?? 0) || 0;
  const pagesCandidate = (p.pages ?? p.totalPages ?? Math.ceil(total / limit)) || 1;
  const pages = Number(pagesCandidate) || 1;
  return { total, page, limit, pages };
}

type ApiGroupMessage = Partial<GroupMessage> & {
  id?: string;
  _id?: string;
  groupId?: unknown;
  content?: unknown;
  messageType?: unknown;
  senderId?: unknown;
  senderName?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  attachments?: unknown;
  replyTo?: unknown;
  isEdited?: unknown;
  isDeleted?: unknown;
  readBy?: unknown;
};

function normalizeGroupMessage(raw: ApiGroupMessage): GroupMessage {
  const _id = String(raw._id ?? raw.id ?? "");
  return {
    _id,
    groupId: raw.groupId != null ? String(raw.groupId) : undefined,
    content: typeof raw.content === "string" ? raw.content : String(raw.content ?? ""),
    messageType:
      typeof raw.messageType === "string" ? raw.messageType : "text",
    senderId: String(raw.senderId ?? ""),
    senderName: typeof raw.senderName === "string" ? raw.senderName : "Someone",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    attachments: Array.isArray(raw.attachments) ? (raw.attachments as any) : undefined,
    replyTo:
      raw.replyTo != null && raw.replyTo !== ""
        ? String(raw.replyTo)
        : undefined,
    isEdited: Boolean(raw.isEdited),
    isDeleted: Boolean(raw.isDeleted),
    readBy: Array.isArray(raw.readBy) ? raw.readBy.map(String) : undefined,
  };
}

// POST /api/v1/chat/groups/create
export const createChatGroup = createAsyncThunk<
  ApiResponse<ChatGroup>,
  CreateChatGroupPayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/createChatGroup", async (payload, { rejectWithValue }) => {
  try {
    if (!payload?.name?.trim()) {
      return rejectWithValue({ message: "Group name is required." });
    }
    const res = await axiosInstance.post("/api/v1/chat/groups/create", {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      profileImage: payload.profileImage?.trim() || undefined,
    });
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return { ...raw, data: normalizeChatGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to create group.",
    });
  }
});

// GET /api/v1/chat/groups?page=&limit=&search=
export const getChatGroups = createAsyncThunk<
  ChatGroupsListResponse,
  { page?: number; limit?: number; search?: string },
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/getChatGroups", async (params, { rejectWithValue }) => {
  try {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const search = params?.search?.trim() || undefined;
    const res = await axiosInstance.get("/api/v1/chat/groups", {
      params: { page, limit, search },
    });
    const body = res.data as {
      success?: boolean;
      data?: ApiChatGroup[];
      pagination?: ApiPagination;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map(normalizeChatGroup),
      pagination: mergeCommunityApiPagination(
        body.pagination ?? { total: list.length, pages: 1 },
        page,
        limit,
      ),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load groups.",
    });
  }
});

// GET /api/v1/chat/groups/{groupId}
export const getChatGroupById = createAsyncThunk<
  ApiResponse<ChatGroup>,
  { groupId: string },
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/getChatGroupById", async ({ groupId }, { rejectWithValue }) => {
  try {
    const id = groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}`);
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return { ...raw, data: normalizeChatGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load group details.",
    });
  }
});

// PUT /api/v1/chat/groups/{groupId}
export const updateChatGroup = createAsyncThunk<
  ApiResponse<ChatGroup>,
  UpdateChatGroupPayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/updateChatGroup", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const body: Record<string, unknown> = {};
    if (payload.name?.trim()) body.name = payload.name.trim();
    if (payload.description?.trim()) body.description = payload.description.trim();
    if (payload.profileImage?.trim()) body.profileImage = payload.profileImage.trim();
    const res = await axiosInstance.put(`/api/v1/chat/groups/${id}`, body);
    const raw = res.data as ApiResponse<ApiChatGroup>;
    return { ...raw, data: normalizeChatGroup(raw.data) };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to update group.",
    });
  }
});

// DELETE /api/v1/chat/groups/{groupId}
export const deleteChatGroup = createAsyncThunk<
  ApiResponse<unknown>,
  { groupId: string },
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/deleteChatGroup", async ({ groupId }, { rejectWithValue }) => {
  try {
    const id = groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const res = await axiosInstance.delete(`/api/v1/chat/groups/${id}`);
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete group.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/members
export const addGroupMembers = createAsyncThunk<
  ApiResponse<unknown>,
  AddGroupMembersPayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/addGroupMembers", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const body: Record<string, unknown> = {};
    if (payload.memberIds?.length) body.memberIds = payload.memberIds;
    if (payload.addAllSameRole === true) {
      body.addAllSameRole = true;
      if (payload.roleToAdd) body.roleToAdd = payload.roleToAdd;
    }
    if (!payload.memberIds?.length && payload.addAllSameRole !== true) {
      return rejectWithValue({
        message: "Provide member IDs or enable add all same role.",
      });
    }
    const res = await axiosInstance.post(`/api/v1/chat/groups/${id}/members`, body);
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to add members.",
    });
  }
});

// DELETE /api/v1/chat/groups/{groupId}/members
export const removeGroupMembers = createAsyncThunk<
  ApiResponse<unknown>,
  RemoveGroupMembersPayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/removeGroupMembers", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!payload.memberIds?.length) {
      return rejectWithValue({ message: "At least one member ID is required." });
    }
    const res = await axiosInstance.delete(`/api/v1/chat/groups/${id}/members`, {
      data: { memberIds: payload.memberIds },
    });
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to remove members.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/promote-admin
export const promoteGroupAdmin = createAsyncThunk<
  ApiResponse<unknown>,
  PromoteGroupAdminPayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/promoteGroupAdmin", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const uid = payload.userId?.trim();
    if (!uid || !isValidObjectId(uid)) {
      return rejectWithValue(invalidIdMessage("userId"));
    }
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/promote-admin`,
      { userId: uid },
    );
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to promote member.",
    });
  }
});

// GET /api/v1/chat/groups/{groupId}/messages?page=&limit=
export const getGroupMessages = createAsyncThunk<
  GroupMessagesListResponse,
  { groupId: string; page?: number; limit?: number },
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/getGroupMessages", async (params, { rejectWithValue }) => {
  try {
    const id = params.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const res = await axiosInstance.get(`/api/v1/chat/groups/${id}/messages`, {
      params: { page, limit },
    });
    const body = res.data as {
      success?: boolean;
      data?: ApiGroupMessage[];
      pagination?: ApiPagination;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    return {
      success: body.success ?? true,
      data: list.map(normalizeGroupMessage),
      pagination: mergeCommunityApiPagination(
        body.pagination ?? { total: list.length, pages: 1 },
        page,
        limit,
      ),
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to load messages.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/messages
export const sendGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  SendGroupMessagePayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/sendGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!payload.content?.trim() && !payload.attachments?.length) {
      return rejectWithValue({ message: "Message content or attachment required." });
    }
    const body: Record<string, unknown> = {
      content: payload.content?.trim() ?? "",
      messageType: payload.messageType ?? "text",
    };
    if (payload.attachments?.length) body.attachments = payload.attachments;
    if (payload.replyTo?.trim()) body.replyTo = payload.replyTo.trim();
    const res = await axiosInstance.post(`/api/v1/chat/groups/${id}/messages`, body);
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) return rejectWithValue({ message: "Invalid response from server." });
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to send message.",
    });
  }
});

// POST /api/v1/chat/groups/{groupId}/messages/{messageId}/reply
export const replyToGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  ReplyToGroupMessagePayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/replyToGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const id = payload.groupId?.trim();
    const messageId = payload.messageId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("groupId"));
    }
    if (!messageId || !isValidObjectId(messageId)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    if (!payload.content?.trim() && !payload.attachments?.length) {
      return rejectWithValue({ message: "Message content or attachment required." });
    }
    const body: Record<string, unknown> = {
      content: payload.content?.trim() ?? "",
      messageType: payload.messageType ?? "text",
    };
    if (payload.attachments?.length) body.attachments = payload.attachments;
    const res = await axiosInstance.post(
      `/api/v1/chat/groups/${id}/messages/${messageId}/reply`,
      body,
    );
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) return rejectWithValue({ message: "Invalid response from server." });
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to send reply.",
    });
  }
});

// PUT /api/v1/chat/messages/{messageId}
export const editGroupMessage = createAsyncThunk<
  ApiResponse<GroupMessage>,
  EditGroupMessagePayload,
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/editGroupMessage", async (payload, { rejectWithValue }) => {
  try {
    const mid = payload.messageId?.trim();
    if (!mid || !isValidObjectId(mid)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    if (!payload.content?.trim()) {
      return rejectWithValue({ message: "Content is required." });
    }
    const res = await axiosInstance.put(`/api/v1/chat/messages/${mid}`, {
      content: payload.content.trim(),
    });
    const raw = res.data as ApiResponse<ApiGroupMessage>;
    const data = raw.data ? normalizeGroupMessage(raw.data) : null;
    if (!data) return rejectWithValue({ message: "Invalid response from server." });
    return { ...raw, data };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to edit message.",
    });
  }
});

// DELETE /api/v1/chat/messages/{messageId}
export const deleteGroupMessage = createAsyncThunk<
  ApiResponse<unknown>,
  { messageId: string },
  { rejectValue: RejectValue }
>("estateAdminCommunityGroup/deleteGroupMessage", async ({ messageId }, { rejectWithValue }) => {
  try {
    const id = messageId?.trim();
    if (!id || !isValidObjectId(id)) {
      return rejectWithValue(invalidIdMessage("messageId"));
    }
    const res = await axiosInstance.delete(`/api/v1/chat/messages/${id}`);
    return (res.data ?? { success: true }) as ApiResponse<unknown>;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete message.",
    });
  }
});

