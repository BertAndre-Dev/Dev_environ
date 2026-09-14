import {
  authorDisplayName,
  type CommentAuthor,
} from "@/lib/maintenance-comments";
import {
  isMongoObjectId,
  resolveRequestActors,
  type RequestActor,
} from "@/lib/request-actor";

export type RequestCommentAuthor = CommentAuthor & {
  name?: string;
};

export type RequestCommentItem = {
  id: string;
  requestId?: string;
  userId?: string;
  text: string;
  image?: string;
  user?: RequestCommentAuthor;
  createdAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function idFrom(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const obj = asRecord(value);
  if (!obj) return "";
  return asId(obj.id) || asId(obj._id) || asId(obj.userId);
}

function parseAuthor(raw: unknown): RequestCommentAuthor | undefined {
  const userRaw = asRecord(raw);
  if (!userRaw) return undefined;
  const id = idFrom(userRaw);
  const firstName =
    typeof userRaw.firstName === "string" ? userRaw.firstName : undefined;
  const lastName =
    typeof userRaw.lastName === "string" ? userRaw.lastName : undefined;
  const email = typeof userRaw.email === "string" ? userRaw.email : undefined;
  const role = typeof userRaw.role === "string" ? userRaw.role : undefined;
  const name = typeof userRaw.name === "string" ? userRaw.name : undefined;
  if (!id && !firstName && !lastName && !email && !name) return undefined;
  return { id, firstName, lastName, email, role, name };
}

export function extractCommentRecords(
  payload: unknown,
): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  }
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) return extractCommentRecords(data);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return extractCommentRecords(nested.items);
    if (Array.isArray(nested.comments)) {
      return extractCommentRecords(nested.comments);
    }
    if (nested.id != null || nested._id != null || nested.text != null) {
      return [nested];
    }
  }
  if (Array.isArray(root.comments)) return extractCommentRecords(root.comments);
  if (Array.isArray(root.items)) return extractCommentRecords(root.items);
  if (root.id != null || root._id != null || root.text != null) return [root];
  return [];
}

export function parseRequestComment(
  raw: Record<string, unknown>,
): RequestCommentItem {
  const user = parseAuthor(raw.user) ?? parseAuthor(raw.userId);
  const image =
    typeof raw.image === "string" && raw.image.trim()
      ? raw.image.trim()
      : undefined;
  const textRaw = raw.text ?? raw.comment;
  const text = typeof textRaw === "string" ? textRaw : "";

  return {
    id: asId(raw._id) || asId(raw.id),
    requestId: idFrom(raw.requestId),
    userId: user?.id || idFrom(raw.userId),
    text,
    image,
    user,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}

export function requestCommentAuthorName(
  comment: RequestCommentItem,
): string {
  const fromUser =
    authorDisplayName(comment.user) || comment.user?.name?.trim() || "";
  if (fromUser) return fromUser;
  return "Stakeholder";
}

function actorToAuthor(actor: RequestActor, fallbackId: string): RequestCommentAuthor {
  return {
    id: actor.id ?? actor.userId ?? fallbackId,
    firstName: actor.firstName,
    lastName: actor.lastName,
    email: actor.email,
    name: actor.name,
  };
}

export async function enrichRequestComments(
  comments: RequestCommentItem[],
): Promise<RequestCommentItem[]> {
  const ids = [
    ...new Set(
      comments
        .filter((comment) => {
          if (requestCommentAuthorName(comment) !== "Stakeholder") return false;
          return Boolean(comment.userId && isMongoObjectId(comment.userId));
        })
        .map((comment) => comment.userId as string),
    ),
  ];
  if (!ids.length) return comments;

  const resolved = await resolveRequestActors(ids);
  if (!resolved.size) return comments;

  return comments.map((comment) => {
    if (!comment.userId) return comment;
    const actor = resolved.get(comment.userId);
    if (!actor) return comment;
    return {
      ...comment,
      user: {
        ...actorToAuthor(actor, comment.userId),
        ...comment.user,
        id: comment.user?.id || actor.id || comment.userId,
      },
    };
  });
}
