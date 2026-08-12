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
    if (!id) return null;
    const name =
      typeof o.name === "string" && o.name.trim() ? o.name.trim() : undefined;
    return { id, name };
  }
  return null;
}

/**
 * Resolve company id/name from `/api/v1/auth-mgt/me` user payload.
 * Checks top-level company fields, then activeContext, current membership,
 * and estate.companyId (common for estate admins under a company).
 */
export function parseCompanyFromUser(data: Record<string, unknown>): {
  id: string;
  name: string;
} | null {
  const candidates: unknown[] = [
    data.companyId,
    data.company,
  ];

  const activeContext = data.activeContext;
  if (activeContext && typeof activeContext === "object") {
    candidates.push((activeContext as Record<string, unknown>).companyId);
  }

  const memberships = Array.isArray(data.memberships) ? data.memberships : [];
  const currentMembership =
    memberships.find(
      (m) =>
        m &&
        typeof m === "object" &&
        Boolean((m as Record<string, unknown>).isCurrent),
    ) ?? memberships[0];
  if (currentMembership && typeof currentMembership === "object") {
    candidates.push((currentMembership as Record<string, unknown>).companyId);
  }

  const estate = data.estateId ?? data.estate;
  if (estate && typeof estate === "object") {
    candidates.push((estate as Record<string, unknown>).companyId);
  }

  let resolved: { id: string; name?: string } | null = null;
  for (const candidate of candidates) {
    const next = extractCompanyRef(candidate);
    if (next) {
      resolved = next;
      break;
    }
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
