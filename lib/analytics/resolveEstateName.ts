/**
 * Resolve a display name for an estate id from scope.estates.
 * Falls back to a truncated id when no match exists (never returns "null").
 */
export function resolveEstateName(
  estateId: string,
  scopeEstates: ReadonlyArray<{ id: string; name: string }>,
): string {
  const id = String(estateId ?? "").trim();
  if (!id) return "Unknown estate";

  const match = scopeEstates.find((estate) => estate.id === id);
  const name = match?.name?.trim();
  if (name) return name;

  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}…`;
}
