/** Normalize user ids from API payloads (`id`, `_id`, `userId`, or populated objects). */
export function normalizeUserId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return String(o._id ?? o.id ?? o.userId ?? "").trim();
  }
  return String(raw).trim();
}

export function isSameUserId(a: unknown, b: unknown): boolean {
  const left = normalizeUserId(a);
  const right = normalizeUserId(b);
  return Boolean(left && right && left === right);
}

export function extractUserId(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const id = normalizeUserId(data.id ?? data._id ?? data.userId);
  return id || null;
}

/** Normalize estate ids from API payloads (`estateId` string or populated estate object). */
export function extractEstateId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || null;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const id = normalizeUserId(o._id ?? o.id);
    return id || null;
  }
  return null;
}

export function extractEstateIdFromUser(
  user: Record<string, unknown> | null | undefined,
): string | null {
  if (!user) return null;
  return extractEstateId(user.estateId) ?? extractEstateId(user.estate);
}

export function extractEstateNameFromUser(
  user: Record<string, unknown> | null | undefined,
): string | null {
  if (!user) return null;
  const fromEstateId = user.estateId;
  if (fromEstateId && typeof fromEstateId === "object") {
    const name = (fromEstateId as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  const estate = user.estate;
  if (estate && typeof estate === "object") {
    const name = (estate as Record<string, unknown>).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  if (typeof user.estateName === "string" && user.estateName.trim()) {
    return user.estateName.trim();
  }
  return null;
}
