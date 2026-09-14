const MIME_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

function extensionFromMime(mime: string): string | undefined {
  const normalized = mime.split(";")[0]?.trim().toLowerCase();
  return normalized ? MIME_EXTENSION[normalized] : undefined;
}

function filenameFromUrl(source: string): string | undefined {
  try {
    const pathname = new URL(source).pathname;
    const base = pathname.split("/").pop()?.trim();
    if (base && base.includes(".")) return decodeURIComponent(base);
  } catch {
    // Ignore invalid URLs — handled by fallback name below.
  }
  return undefined;
}

export function getAttachmentFilename(source: string, index: number): string {
  const fallback = `attachment-${index + 1}`;

  if (source.startsWith("data:")) {
    const match = /^data:([^;,]+)/i.exec(source);
    const ext = match?.[1] ? extensionFromMime(match[1]) : undefined;
    return ext ? `${fallback}.${ext}` : fallback;
  }

  return filenameFromUrl(source) ?? fallback;
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Open a request attachment in a new browser tab. */
export function openAttachmentInNewTab(source: string): void {
  const trimmed = source.trim();
  if (!trimmed || typeof window === "undefined") return;
  window.open(trimmed, "_blank", "noopener,noreferrer");
}

/** Download a request attachment (data URL or remote URL). */
export async function downloadAttachment(
  source: string,
  filename: string,
): Promise<void> {
  const trimmed = source.trim();
  if (!trimmed) return;

  if (trimmed.startsWith("data:")) {
    triggerDownload(trimmed, filename);
    return;
  }

  try {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerDownload(objectUrl, filename);
    URL.revokeObjectURL(objectUrl);
  } catch {
    triggerDownload(trimmed, filename);
  }
}
