import { inferFileMimeType } from "@/lib/uploads/constants";
import { compressImageIfNeeded } from "@/lib/uploads/compressImage";

function withMimeType(dataUrl: string, mimeType: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl;
  const payload = dataUrl.slice(comma + 1);
  return `data:${mimeType};base64,${payload}`;
}

/** Read a file as a full data URI, e.g. `data:image/png;base64,...`. Browser FileReader only. */
export async function fileToDataUri(file: File): Promise<string> {
  const prepared = await compressImageIfNeeded(file);
  const mimeType = inferFileMimeType(prepared);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result) {
        reject(new Error("Failed to read file."));
        return;
      }
      resolve(withMimeType(result, mimeType));
    };
    reader.readAsDataURL(prepared);
  });
}

/** Read a file as raw base64 payload (no `data:*;base64,` prefix). */
export function fileToRawBase64(file: File): Promise<string> {
  return fileToDataUri(file).then((dataUrl) => {
    const i = dataUrl.indexOf("base64,");
    return i >= 0 ? dataUrl.slice(i + "base64,".length) : dataUrl;
  });
}
