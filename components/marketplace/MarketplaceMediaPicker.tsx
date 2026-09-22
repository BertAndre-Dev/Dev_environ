"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ImagePlus, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MultiFileUploadItem } from "@/hooks/useMultiFileUpload";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAttachmentFilename } from "@/lib/download-attachment";
import {
  IMAGE_ACCEPT_ATTR,
  VIDEO_ACCEPT_ATTR,
} from "@/lib/uploads/constants";
import { uploadFile } from "@/lib/uploads/uploadFile";
import { validateFile } from "@/lib/uploads/validate";
import { selectAuthToken } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";
import { cn } from "@/lib/utils";
import { MARKETPLACE_PRESS } from "@/lib/marketplace";

const PRESS = MARKETPLACE_PRESS;

let uploadSeq = 0;
function newId() {
  uploadSeq += 1;
  return `media-${Date.now()}-${uploadSeq}`;
}

type Props = Readonly<{
  kind: "image" | "video";
  urls: string[];
  maxFiles: number;
  disabled?: boolean;
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}>;

export function MarketplaceMediaPicker({
  kind,
  urls,
  maxFiles,
  disabled = false,
  onChange,
  onBusyChange,
}: Props) {
  const inputId = useId();
  const token = useSelector((state: RootState) => selectAuthToken(state));
  const [pending, setPending] = useState<MultiFileUploadItem[]>([]);
  const isUploading = pending.some((item) => item.status === "uploading");

  useEffect(() => {
    onBusyChange?.(isUploading);
  }, [isUploading, onBusyChange]);

  const items: MultiFileUploadItem[] = [
    ...urls.map((url, index) => ({
      id: `done-${index}-${url}`,
      name: getAttachmentFilename(url, index),
      url,
      status: "succeeded" as const,
      progress: 100,
      error: null,
    })),
    ...pending,
  ];

  const remaining =
    maxFiles - urls.length - pending.filter((item) => item.status !== "failed").length;

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (remaining <= 0) {
        toast.error(
          `You can add up to ${maxFiles} ${kind === "image" ? "photos" : "videos"}.`,
        );
        return;
      }
      if (!token) {
        toast.error("You must be signed in to upload a file.");
        return;
      }

      const selected = files.slice(0, remaining);
      let nextUrls = [...urls];

      for (const file of selected) {
        const id = newId();
        const validation = validateFile(file, { kind });
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
            accept: kind,
            onProgress: (percent) => {
              setPending((prev) =>
                prev.map((item) =>
                  item.id === id ? { ...item, progress: percent } : item,
                ),
              );
            },
          });
          setPending((prev) => prev.filter((item) => item.id !== id));
          nextUrls = [...nextUrls, result.file_url];
          onChange(nextUrls);
        } catch (err: unknown) {
          const message = getApiErrorMessage(err) || "Failed to upload file.";
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
    },
    [kind, maxFiles, onChange, remaining, token, urls],
  );

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "grid gap-3",
          kind === "image" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1",
        )}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-2xl border border-black/5 bg-muted/40"
          >
            {kind === "image" && item.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.name}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="flex h-20 items-center gap-3 px-4">
                <Video className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.status === "uploading" ? (
                    <p className="text-xs text-muted-foreground">
                      {item.progress}%
                    </p>
                  ) : item.status === "failed" ? (
                    <p className="text-xs text-destructive">
                      {item.error ?? "Upload failed"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ready</p>
                  )}
                </div>
              </div>
            )}
            {item.status === "uploading" && kind === "image" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                {item.progress}%
              </div>
            ) : null}
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn("absolute top-2 right-2 size-8 rounded-full", PRESS)}
              onClick={() => {
                if (item.id.startsWith("done-")) {
                  onChange(urls.filter((url) => url !== item.url));
                  return;
                }
                setPending((prev) => prev.filter((entry) => entry.id !== item.id));
              }}
              disabled={disabled || item.status === "uploading"}
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        {remaining > 0 ? (
          <label
            htmlFor={inputId}
            className={cn(
              "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-muted/20 px-4 py-5 text-center",
              "transition-colors hover:bg-muted/40",
              PRESS,
              (disabled || isUploading) && "pointer-events-none opacity-60",
            )}
          >
            {kind === "image" ? (
              <ImagePlus className="size-5 text-muted-foreground" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {kind === "image" ? "Add photos" : "Add videos"}
            </span>
            <span className="text-xs text-muted-foreground">
              {remaining} remaining
            </span>
          </label>
        ) : null}
      </div>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={kind === "image" ? IMAGE_ACCEPT_ATTR : VIDEO_ACCEPT_ATTR}
        multiple
        disabled={disabled || remaining <= 0}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addFiles(files);
        }}
      />
    </div>
  );
}
