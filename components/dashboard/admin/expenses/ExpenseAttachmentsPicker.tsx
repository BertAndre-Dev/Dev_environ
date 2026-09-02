"use client";

import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { MultiFileUploadInput } from "@/components/upload/MultiFileUploadInput";
import { getAttachmentFilename } from "@/lib/download-attachment";
import { getApiErrorMessage } from "@/lib/api-error";
import { GENERAL_ACCEPT_ATTR } from "@/lib/uploads/constants";
import { uploadFile } from "@/lib/uploads/uploadFile";
import { validateFile } from "@/lib/uploads/validate";
import {
  type MultiFileUploadItem,
} from "@/hooks/useMultiFileUpload";
import { selectAuthToken } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";

const MAX_ATTACHMENTS = 5;

export type ExpenseDraftAttachment = {
  name: string;
  url: string;
};

export function toDraftAttachments(
  urls: string[] | undefined,
): ExpenseDraftAttachment[] {
  return (urls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: getAttachmentFilename(url, index),
      url,
    }));
}

let uploadIdSeq = 0;

function newId(): string {
  uploadIdSeq += 1;
  return `upload-${Date.now()}-${uploadIdSeq}`;
}

export function ExpenseAttachmentsPicker({
  attachments,
  disabled,
  onChange,
  onBusyChange,
}: Readonly<{
  attachments: ExpenseDraftAttachment[];
  disabled: boolean;
  onChange: (next: ExpenseDraftAttachment[]) => void;
  onBusyChange?: (busy: boolean) => void;
}>) {
  const token = useSelector((state: RootState) => selectAuthToken(state));
  const [pending, setPending] = useState<MultiFileUploadItem[]>([]);
  const isUploading = pending.some((item) => item.status === "uploading");

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  const items: MultiFileUploadItem[] = [
    ...attachments.map((file, index) => ({
      id: `done-${index}-${file.url}`,
      name: file.name,
      url: file.url,
      status: "succeeded" as const,
      progress: 100,
      error: null,
    })),
    ...pending,
  ];

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return [];
      const remaining = MAX_ATTACHMENTS - attachments.length - pending.filter((item) => item.status !== "failed").length;
      if (remaining <= 0) {
        toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per entry.`);
        return [];
      }
      if (!token) {
        toast.error("You must be signed in to upload a file.");
        return [];
      }

      const selected = files.slice(0, remaining);
      const uploaded: string[] = [];
      let nextAttachments = [...attachments];

      for (const file of selected) {
        const id = newId();
        const validation = validateFile(file, { kind: "general" });
        if (!validation.ok) {
          toast.error(validation.error);
          continue;
        }

        setPending((prev) => [
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
          const result = await uploadFile(file, token, "general", {
            onProgress: (percent) => {
              setPending((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, progress: percent } : item,
                ),
              );
            },
          });
          setPending((prev) => prev.filter((item) => item.id !== id));
          nextAttachments = [
            ...nextAttachments,
            { name: file.name, url: result.file_url },
          ];
          onChange(nextAttachments);
          uploaded.push(result.file_url);
        } catch (err: unknown) {
          const message =
            getApiErrorMessage(err) || "Failed to upload file.";
          setPending((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: "failed", error: message }
                : item,
            ),
          );
          toast.error(message);
        }
      }

      return uploaded;
    },
    [attachments, pending, token, onChange],
  );

  const remove = (id: string) => {
    if (id.startsWith("done-")) {
      const index = attachments.findIndex(
        (file, i) => `done-${i}-${file.url}` === id,
      );
      if (index >= 0) {
        onChange(attachments.filter((_, i) => i !== index));
      }
      return;
    }
    setPending((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <MultiFileUploadInput
      items={items}
      onAddFiles={addFiles}
      onRemove={remove}
      acceptAttr={GENERAL_ACCEPT_ATTR}
      maxFiles={MAX_ATTACHMENTS}
      isUploading={isUploading}
      disabled={disabled}
      label="Attachments"
      hint={`Up to ${MAX_ATTACHMENTS} files, 10MB each. Images, PDF, DOC, DOCX, XLS, XLSX.`}
    />
  );
}
