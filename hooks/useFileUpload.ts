"use client";

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import { selectAuthToken } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";
import {
  acceptAttrFor,
  type FileAcceptKind,
  type UploadKind,
} from "@/lib/uploads/constants";
import { uploadFile } from "@/lib/uploads/uploadFile";
import { validateFile } from "@/lib/uploads/validate";

export type UseFileUploadOptions = {
  kind?: UploadKind;
  accept?: FileAcceptKind;
};

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const kind = options.kind ?? "general";
  const accept = options.accept ?? (kind === "avatar" ? "image" : "general");
  const token = useSelector((state: RootState) => selectAuthToken(state));

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setFileUrl(null);
    setFileName(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      const validation = validateFile(file, { kind: accept });
      if (!validation.ok) {
        setError(validation.error);
        return null;
      }
      if (!token) {
        const message = "You must be signed in to upload a file.";
        setError(message);
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);
      setFileUrl(null);
      setFileName(file.name);

      try {
        const result = await uploadFile(file, token, kind, {
          onProgress: setProgress,
        });
        setFileUrl(result.file_url);
        setProgress(100);
        return result.file_url;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to upload file.";
        setError(message);
        setFileUrl(null);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [accept, kind, token],
  );

  return {
    isUploading,
    progress,
    error,
    fileUrl,
    fileName,
    acceptAttr: acceptAttrFor(accept),
    upload,
    reset,
  };
}
