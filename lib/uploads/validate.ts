import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_GENERAL_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  inferFileMimeType,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGE_SIZE_BYTES,
  type FileAcceptKind,
  type UploadKind,
} from "@/lib/uploads/constants";

export type ValidateFileKind = UploadKind | FileAcceptKind;

export type ValidateFileOptions = {
  kind?: ValidateFileKind;
  maxBytes?: number;
  allowedMimeTypes?: readonly string[];
};

export type ValidateFileSuccess = {
  ok: true;
  mimeType: string;
};

export type ValidateFileFailure = {
  ok: false;
  error: string;
};

export type ValidateFileResult = ValidateFileSuccess | ValidateFileFailure;

function rulesFor(
  kind: ValidateFileKind | undefined,
): { maxBytes: number; allowed: readonly string[]; label: string } {
  if (kind === "avatar" || kind === "image") {
    return {
      maxBytes: MAX_IMAGE_SIZE_BYTES,
      allowed: ALLOWED_IMAGE_MIME_TYPES,
      label: "JPEG, PNG, WebP, or GIF image",
    };
  }
  if (kind === "document") {
    return {
      maxBytes: MAX_FILE_SIZE_BYTES,
      allowed: ALLOWED_DOCUMENT_MIME_TYPES,
      label: "PDF, DOC, DOCX, XLS, or XLSX file",
    };
  }
  return {
    maxBytes: MAX_FILE_SIZE_BYTES,
    allowed: ALLOWED_GENERAL_MIME_TYPES,
    label: "image or PDF/DOC/DOCX/XLS/XLSX file",
  };
}

export function validateFile(
  file: File,
  opts: ValidateFileOptions = {},
): ValidateFileResult {
  const defaults = rulesFor(opts.kind);
  const maxBytes = opts.maxBytes ?? defaults.maxBytes;
  const allowed = opts.allowedMimeTypes ?? defaults.allowed;
  const mimeType = inferFileMimeType(file);

  if (file.size <= 0) {
    return { ok: false, error: `${file.name} is empty.` };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `${file.name} exceeds ${mb}MB.` };
  }
  if (!allowed.includes(mimeType)) {
    return {
      ok: false,
      error: `${file.name} is not a supported ${defaults.label}.`,
    };
  }

  return { ok: true, mimeType };
}
