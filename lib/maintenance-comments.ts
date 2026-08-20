export type CommentAuthor = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

export type NormalizedComment = {
  id: string;
  complaintId: string;
  userId: string;
  text: string;
  user?: CommentAuthor;
  createdAt?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function asId(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function idFrom(value: unknown): string {
  if (typeof value === "string") return value;
  const obj = asRecord(value);
  if (!obj) return "";
  return asId(obj.id) || asId(obj._id);
}

export function authorDisplayName(user?: CommentAuthor | null): string {
  if (!user) return "";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (user.email?.trim()) return user.email.trim();
  return "";
}

export function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const last = parts.at(-1) ?? "";
  return (parts[0][0] + last[0]).toUpperCase();
}

export function residentIdFromComplaint(complaint: {
  residentId?: string | { id?: string; _id?: string };
  resident?: { id?: string; _id?: string };
}): string {
  if (typeof complaint.residentId === "string") return complaint.residentId;
  if (complaint.residentId && typeof complaint.residentId === "object") {
    return String(complaint.residentId.id ?? complaint.residentId._id ?? "");
  }
  return String(complaint.resident?.id ?? complaint.resident?._id ?? "");
}

export function isResidentComment(
  comment: { userId?: string },
  residentId: string,
): boolean {
  return Boolean(residentId && comment.userId && comment.userId === residentId);
}

/** API returns populated `userId` / `complaintId` objects, not a `user` field. */
export function parseCommentPayload(
  raw: Record<string, unknown>,
): NormalizedComment {
  const id = asId(raw._id) || asId(raw.id);
  const userRaw = asRecord(raw.userId) ?? asRecord(raw.user);
  const user: CommentAuthor | undefined = userRaw
    ? {
        id: idFrom(userRaw),
        firstName:
          typeof userRaw.firstName === "string" ? userRaw.firstName : undefined,
        lastName:
          typeof userRaw.lastName === "string" ? userRaw.lastName : undefined,
        email: typeof userRaw.email === "string" ? userRaw.email : undefined,
        role: typeof userRaw.role === "string" ? userRaw.role : undefined,
      }
    : undefined;

  return {
    id,
    complaintId: idFrom(raw.complaintId),
    userId: user?.id || idFrom(raw.userId),
    text: typeof raw.text === "string" ? raw.text : "",
    user,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
  };
}
