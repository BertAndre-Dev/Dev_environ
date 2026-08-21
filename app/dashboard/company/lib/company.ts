/** Normalize a company id/name from a string or populated object. */
function extractCompanyRef(raw: unknown): { id: string; name?: string } | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const id = raw.trim();
    return id ? { id } : null;
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const id = String(o._id ?? o.id ?? "").trim();
    const nestedCompanyId =
      typeof o.companyId === "string"
        ? o.companyId.trim()
        : extractCompanyRef(o.companyId)?.id ?? "";
    // Populated estate objects have their own id plus a nested companyId.
    if (nestedCompanyId && nestedCompanyId !== id) {
      const nested =
        typeof o.companyId === "object" && o.companyId
          ? extractCompanyRef(o.companyId)
          : null;
      return { id: nestedCompanyId, name: nested?.name };
    }
    if (!id) return null;
    const name =
      typeof o.name === "string" && o.name.trim() ? o.name.trim() : undefined;
    return { id, name };
  }
  return null;
}

function extractEstateId(data: Record<string, unknown>): string {
  const estate = data.estateId ?? data.estate;
  if (typeof estate === "string") return estate.trim();
  if (estate && typeof estate === "object") {
    const record = estate as Record<string, unknown>;
    return String(record._id ?? record.id ?? "").trim();
  }
  const activeContext = data.activeContext;
  if (activeContext && typeof activeContext === "object") {
    const id = (activeContext as Record<string, unknown>).estateId;
    return typeof id === "string" ? id.trim() : "";
  }
  return "";
}

/**
 * Resolve company id/name from `/api/v1/auth-mgt/me` user payload.
 * Prefers active membership, then nested estate.companyId. Never returns the
 * estate id itself as the company id.
 */
export function parseCompanyFromUser(data: Record<string, unknown>): {
  id: string;
  name: string;
} | null {
  const estateId = extractEstateId(data);
  const activeContext = data.activeContext;
  const memberships = Array.isArray(data.memberships) ? data.memberships : [];
  const currentMembership =
    memberships.find(
      (m) =>
        m &&
        typeof m === "object" &&
        Boolean((m as Record<string, unknown>).isCurrent),
    ) ?? memberships[0];

  const candidates: unknown[] = [];
  if (activeContext && typeof activeContext === "object") {
    candidates.push((activeContext as Record<string, unknown>).companyId);
  }
  if (currentMembership && typeof currentMembership === "object") {
    candidates.push((currentMembership as Record<string, unknown>).companyId);
  }
  const estate = data.estateId ?? data.estate;
  if (estate && typeof estate === "object") {
    candidates.push((estate as Record<string, unknown>).companyId);
  }
  candidates.push(data.company, data.companyId);

  let resolved: { id: string; name?: string } | null = null;
  for (const candidate of candidates) {
    const next = extractCompanyRef(candidate);
    if (!next) continue;
    if (estateId && next.id === estateId) continue;
    resolved = next;
    break;
  }

  if (!resolved) return null;

  const name =
    resolved.name ||
    (typeof data.companyName === "string" && data.companyName.trim()
      ? data.companyName.trim()
      : undefined) ||
    "Company";

  return { id: resolved.id, name };
}
