"use client";

import { useCallback, useState } from "react";
import { useSelector } from "react-redux";

import { getAttachmentFilename } from "@/lib/download-attachment";
import {
  acceptAttrFor,
  type FileAcceptKind,
  type UploadKind,
} from "@/lib/uploads/constants";
import { uploadFile } from "@/lib/uploads/uploadFile";
import { validateFile } from "@/lib/uploads/validate";
import { selectAuthToken } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";

export type MultiFileUploadStatus = "uploading" | "succeeded" | "failed";

export type MultiFileUploadItem = {
  id: string;
  name: string;
  url: string | null;
  status: MultiFileUploadStatus;
  progress: number;
  error: string | null;
};

export type UseMultiFileUploadOptions = {
  kind?: UploadKind;
  accept?: FileAcceptKind;
  maxFiles?: number;
};

let uploadIdSeq = 0;

function newItemId(): string {
  uploadIdSeq += 1;
  return `upload-${Date.now()}-${uploadIdSeq}`;
}

export function itemsFromUrls(urls: string[]): MultiFileUploadItem[] {
  return urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      id: `existing-${index}-${url}`,
      name: getAttachmentFilename(url, index),
      url,
      status: "succeeded" as const,
      progress: 100,
      error: null,
    }));
}

export function useMultiFileUpload(options: UseMultiFileUploadOptions = {}) {
  const kind = options.kind ?? "general";
  const accept = options.accept ?? (kind === "avatar" ? "image" : "general");
  const maxFiles = options.maxFiles ?? 5;
  const token = useSelector((state: RootState) => selectAuthToken(state));

  const [items, setItems] = useState<MultiFileUploadItem[]>([]);

  const fileUrls = items
    .filter(
      (item): item is MultiFileUploadItem & { url: string } =>
        item.status === "succeeded" && Boolean(item.url),
    )
    .map((item) => item.url);

  const isUploading = items.some((item) => item.status === "uploading");
  const error =
    items.find((item) => item.status === "failed")?.error ?? null;

  const reset = useCallback(() => {
    setItems([]);
  }, []);

  const setFromUrls = useCallback((urls: string[]) => {
    setItems(itemsFromUrls(urls));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      if (!files.length) return [];

      const remaining = maxFiles - items.filter((item) => item.status !== "failed").length;
      if (remaining <= 0) {
        setItems((prev) => [
          ...prev,
          {
            id: newItemId(),
            name: files[0]?.name ?? "file",
            url: null,
            status: "failed",
            progress: 0,
            error: `You can attach up to ${maxFiles} files.`,
          },
        ]);
        return [];
      }

      if (!token) {
        setItems((prev) => [
          ...prev,
          {
            id: newItemId(),
            name: files[0]?.name ?? "file",
            url: null,
            status: "failed",
            progress: 0,
            error: "You must be signed in to upload a file.",
          },
        ]);
        return [];
      }

      const selected = files.slice(0, remaining);
      const uploaded: string[] = [];

      for (const file of selected) {
        const id = newItemId();
        const validation = validateFile(file, { kind: accept });
        if (!validation.ok) {
          setItems((prev) => [
            ...prev,
            {
              id,
              name: file.name,
              url: null,
              status: "failed",
              progress: 0,
              error: validation.error,
            },
          ]);
          continue;
        }

        setItems((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            url: null,
            status: "uploading",
            progress: 0,
            error: null,
          },
        ]);

        try {
          const result = await uploadFile(file, token, kind, {
            onProgress: (percent) => {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, progress: percent } : item,
                ),
              );
            },
          });
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    url: result.file_url,
                    status: "succeeded",
                    progress: 100,
                    error: null,
                  }
                : item,
            ),
          );
          uploaded.push(result.file_url);
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to upload file.";
          setItems((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: "failed", error: message }
                : item,
            ),
          );
        }
      }

      return uploaded;
    },
    [accept, items, kind, maxFiles, token],
  );

  return {
    items,
    fileUrls,
    isUploading,
    error,
    acceptAttr: acceptAttrFor(accept),
    maxFiles,
    addFiles,
    remove,
    reset,
    setFromUrls,
  };
}
