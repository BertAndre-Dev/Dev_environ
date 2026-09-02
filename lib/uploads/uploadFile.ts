import axiosInstance from "@/utils/axiosInstance";
import { getApiErrorMessage } from "@/lib/api-error";
import { compressImageIfNeeded } from "@/lib/uploads/compressImage";
import { validateFile } from "@/lib/uploads/validate";
import type { UploadKind } from "@/lib/uploads/constants";

export type UploadedFile = {
  file_url: string;
  file_key: string;
};

export type UploadFileOptions = {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

type UploadApiResponse = {
  success?: boolean;
  file_url?: string;
  file_key?: string;
  message?: string;
};

function endpointFor(kind: UploadKind): string {
  return kind === "avatar"
    ? "/api/v1/uploads/user-avatar"
    : "/api/v1/uploads";
}

export async function uploadFile(
  file: File,
  token: string,
  kind: UploadKind,
  options?: UploadFileOptions,
): Promise<UploadedFile> {
  if (!token.trim()) {
    throw new Error("You must be signed in to upload a file.");
  }

  const validation = validateFile(file, { kind });
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const prepared = await compressImageIfNeeded(file);
  const formData = new FormData();
  formData.append("file", prepared, prepared.name);

  try {
    const res = await axiosInstance.post<UploadApiResponse>(
      endpointFor(kind),
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        transformRequest: [
          (data, headers) => {
            if (typeof headers.setContentType === "function") {
              headers.setContentType(false);
            } else {
              delete headers["Content-Type"];
            }
            return data;
          },
        ],
        signal: options?.signal,
        onUploadProgress: (event) => {
          if (!options?.onProgress) return;
          const total = event.total;
          if (!total) return;
          options.onProgress(
            Math.min(100, Math.round((event.loaded / total) * 100)),
          );
        },
      },
    );

    const fileUrl = res.data?.file_url?.trim() ?? "";
    const fileKey = res.data?.file_key?.trim() ?? "";
    if (!fileUrl) {
      throw new Error(res.data?.message?.trim() || "Upload did not return a file URL.");
    }

    return { file_url: fileUrl, file_key: fileKey };
  } catch (error: unknown) {
    const message = getApiErrorMessage(error);
    throw new Error(message || "Failed to upload file.");
  }
}
