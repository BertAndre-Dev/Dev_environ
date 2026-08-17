import axiosInstance from "@/utils/axiosInstance";

export interface RequestActor {
  id?: string;
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function isMongoObjectId(value: string): boolean {
  return OBJECT_ID_RE.test(value.trim());
}

/** Normalize request actor payloads (id string, user object, or recipient shape). */
export function normalizeRequestActor(
  raw: unknown,
): string | RequestActor | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || undefined;
  }
  if (typeof raw !== "object") return undefined;

  const item = raw as Record<string, unknown>;
  const id =
    item.id != null
      ? String(item.id)
      : item.userId != null
        ? String(item.userId)
        : undefined;

  return {
    id,
    _id: item._id != null ? String(item._id) : undefined,
    userId: item.userId != null ? String(item.userId) : undefined,
    firstName:
      item.firstName != null ? String(item.firstName) : undefined,
    lastName: item.lastName != null ? String(item.lastName) : undefined,
    email: item.email != null ? String(item.email) : undefined,
    name: item.name != null ? String(item.name) : undefined,
  };
}

export function getRequestActorDisplayName(
  actor?: string | RequestActor,
): string {
  if (!actor) return "—";
  if (typeof actor === "string") {
    const trimmed = actor.trim();
    if (!trimmed) return "—";
    if (isMongoObjectId(trimmed)) return "—";
    return trimmed;
  }

  const explicitName = actor.name?.trim();
  if (explicitName) return explicitName;

  const combined = [actor.firstName, actor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (combined) return combined;

  const email = actor.email?.trim();
  if (email) return email;

  return "—";
}

function actorNeedsResolution(actor: string | RequestActor): boolean {
  if (typeof actor === "string") return isMongoObjectId(actor);
  const hasName = Boolean(
    actor.name?.trim() ||
      [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() ||
      actor.email?.trim(),
  );
  if (hasName) return false;
  const id = (actor.id ?? actor._id ?? actor.userId)?.trim();
  return Boolean(id && isMongoObjectId(id));
}

function actorLookupId(actor: string | RequestActor): string | undefined {
  if (typeof actor === "string") return actor.trim() || undefined;
  return (actor.id ?? actor._id ?? actor.userId)?.trim() || undefined;
}

export function collectUnresolvedActorIds(
  actors: Array<string | RequestActor | undefined>,
): string[] {
  const ids = new Set<string>();
  for (const actor of actors) {
    if (!actor || !actorNeedsResolution(actor)) continue;
    const id = actorLookupId(actor);
    if (id) ids.add(id);
  }
  return [...ids];
}

function extractUserPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const root = data as Record<string, unknown>;
  return root.data ?? data;
}

export async function resolveRequestActors(
  ids: string[],
): Promise<Map<string, RequestActor>> {
  const map = new Map<string, RequestActor>();
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return map;

  await Promise.all(
    unique.map(async (id) => {
      try {
        const res = await axiosInstance.get(`/api/v1/user-mgt/${id}`);
        const actor = normalizeRequestActor(extractUserPayload(res.data));
        if (actor && typeof actor !== "string") {
          map.set(id, {
            ...actor,
            id: actor.id ?? actor.userId ?? id,
            _id: actor._id ?? id,
          });
        }
      } catch {
        // Keep unresolved actors as-is; UI falls back to em dash.
      }
    }),
  );

  return map;
}

function mergeResolvedActor(
  actor: string | RequestActor | undefined,
  resolved: Map<string, RequestActor>,
): string | RequestActor | undefined {
  if (!actor) return actor;

  const lookupId = actorLookupId(actor);
  if (!lookupId) return actor;

  const match = resolved.get(lookupId);
  if (!match) return actor;

  if (typeof actor === "string") return match;

  return {
    ...match,
    ...actor,
    id: actor.id ?? match.id ?? lookupId,
    _id: actor._id ?? match._id ?? lookupId,
    firstName: actor.firstName ?? match.firstName,
    lastName: actor.lastName ?? match.lastName,
    email: actor.email ?? match.email,
    name: actor.name ?? match.name,
  };
}

export interface RequestActorEnrichmentItem {
  createdBy?: string | RequestActor;
  decisions?: Array<{ decidedBy?: string | RequestActor }>;
}

export async function enrichRequestItemsWithActorNames<
  T extends RequestActorEnrichmentItem,
>(items: T[]): Promise<T[]> {
  const ids = collectUnresolvedActorIds(
    items.flatMap((item) => [
      item.createdBy,
      ...(item.decisions?.map((decision) => decision.decidedBy) ?? []),
    ]),
  );
  if (!ids.length) return items;

  const resolved = await resolveRequestActors(ids);
  if (!resolved.size) return items;

  return items.map((item) => ({
    ...item,
    createdBy: mergeResolvedActor(item.createdBy, resolved),
    decisions: item.decisions?.map((decision) => ({
      ...decision,
      decidedBy: mergeResolvedActor(decision.decidedBy, resolved),
    })),
  }));
}

export function resolveCreatedByFromRaw(
  raw: Record<string, unknown>,
): string | RequestActor | undefined {
  return normalizeRequestActor(
    raw.createdBy ??
      raw.createdByUser ??
      raw.createdByRecipient ??
      raw.creator,
  );
}
