/** Extract `message` from API / rejectWithValue payloads without inventing fallbacks. */
export function getApiErrorMessage(error: unknown): string | undefined {
  if (error == null) return undefined;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed || undefined;
  }

  if (typeof error !== "object") return undefined;

  const message = (error as { message?: unknown }).message;
  if (typeof message === "string") {
    const trimmed = message.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(message)) {
    const joined = message
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .join(", ");
    return joined || undefined;
  }

  const responseData = (error as { response?: { data?: unknown } }).response
    ?.data;
  if (responseData && responseData !== error) {
    return getApiErrorMessage(responseData);
  }

  return undefined;
}

export function getApiSuccessMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message.trim();
  return undefined;
}
