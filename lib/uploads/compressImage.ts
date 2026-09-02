import { inferFileMimeType, type ImageMimeType } from "@/lib/uploads/constants";

/** Stay under typical nginx `client_max_body_size 1m` after multipart overhead. */
export const PROXY_SAFE_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGE_EDGE = 1920;

function isCompressibleImage(mimeType: string): mimeType is ImageMimeType {
  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp"
  );
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image."));
    };
    image.src = url;
  });
}

async function decodeImage(
  file: File,
): Promise<{ width: number; height: number; source: CanvasImageSource; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
      close: () => bitmap.close(),
    };
  }
  const image = await loadHtmlImage(file);
  return { width: image.naturalWidth, height: image.naturalHeight, source: image };
}

/**
 * Shrink large photos so they fit typical reverse-proxy body limits.
 * GIFs and non-images are returned unchanged.
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (typeof window === "undefined") return file;

  const mimeType = inferFileMimeType(file);
  if (!isCompressibleImage(mimeType)) return file;
  if (file.size <= PROXY_SAFE_IMAGE_BYTES) return file;

  try {
    const decoded = await decodeImage(file);
    let width = decoded.width;
    let height = decoded.height;
    if (width < 1 || height < 1) {
      decoded.close?.();
      return file;
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      decoded.close?.();
      return file;
    }

    let quality = 0.82;
    let best: Blob | null = null;

    for (let pass = 0; pass < 6; pass += 1) {
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(decoded.source, 0, 0, width, height);
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (blob) best = blob;
      if (blob && blob.size <= PROXY_SAFE_IMAGE_BYTES) break;
      quality = Math.max(0.45, quality - 0.12);
      if (pass >= 2) {
        width = Math.max(1, Math.round(width * 0.75));
        height = Math.max(1, Math.round(height * 0.75));
      }
    }

    decoded.close?.();

    if (!best || best.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([best], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
