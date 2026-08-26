"use client";

import React, { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAttachmentFilename } from "@/lib/download-attachment";
import { fileToBase64 } from "@/lib/file-to-base64";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf";

export type ExpenseDraftAttachment = {
  name: string;
  dataUrl: string;
};

export function toDraftAttachments(
  urls: string[] | undefined,
): ExpenseDraftAttachment[] {
  return (urls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .map((dataUrl, index) => ({
      name: getAttachmentFilename(dataUrl, index),
      dataUrl,
    }));
}

export function ExpenseAttachmentsPicker({
  attachments,
  disabled,
  onChange,
}: Readonly<{
  attachments: ExpenseDraftAttachment[];
  disabled: boolean;
  onChange: (next: ExpenseDraftAttachment[]) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per entry.`);
      e.target.value = "";
      return;
    }

    const selected = files.slice(0, remaining);
    setReading(true);
    try {
      const next: ExpenseDraftAttachment[] = [];
      for (const file of selected) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} exceeds 10MB.`);
          continue;
        }
        const dataUrl = await fileToBase64(file);
        next.push({ name: file.name, dataUrl });
      }
      if (next.length) onChange([...attachments, ...next]);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) || "Failed to read file.";
      toast.error(message);
    } finally {
      setReading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Attachments</p>
      {attachments.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(attachments.filter((_, i) => i !== index))
                }
                disabled={disabled}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFilesSelected}
        disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="mr-2 h-4 w-4" />
        {reading ? "Reading files..." : "Add files"}
      </Button>
    </div>
  );
}
