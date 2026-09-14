export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const ALLOWED_GENERAL_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
export type DocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];
export type GeneralMimeType = (typeof ALLOWED_GENERAL_MIME_TYPES)[number];

export type UploadKind = "avatar" | "general";
export type FileAcceptKind = "image" | "document" | "general";

export const IMAGE_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/gif";

export const DOCUMENT_ACCEPT_ATTR =
  ".pdf,.doc,.docx,.xls,.xlsx,application/pdf";

export const GENERAL_ACCEPT_ATTR = `${IMAGE_ACCEPT_ATTR},${DOCUMENT_ACCEPT_ATTR}`;

const IMAGE_EXT_MIME: Record<string, ImageMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const DOCUMENT_EXT_MIME: Record<string, DocumentMimeType> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

/** Infer MIME when the browser reports empty or generic types (e.g. WebP as octet-stream). */
export function inferFileMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const ext = extensionOf(file);
  return (
    IMAGE_EXT_MIME[ext] ??
    DOCUMENT_EXT_MIME[ext] ??
    (file.type || "application/octet-stream")
  );
}

export function acceptAttrFor(kind: FileAcceptKind): string {
  if (kind === "image") return IMAGE_ACCEPT_ATTR;
  if (kind === "document") return DOCUMENT_ACCEPT_ATTR;
  return GENERAL_ACCEPT_ATTR;
}

export function isAllowedMime(
  mimeType: string,
  allowed: readonly string[],
): boolean {
  return allowed.includes(mimeType);
}

export function isHostedHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value.trim());
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
