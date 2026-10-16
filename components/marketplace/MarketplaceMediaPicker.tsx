"use client";

import { useId } from "react";
import { toast } from "react-toastify";
import { ImagePlus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAttachmentFilename } from "@/lib/download-attachment";
import { MARKETPLACE_PRESS } from "@/lib/marketplace";
import {
  MARKETPLACE_MEDIA_ACCEPT,
  marketplaceFileKind,
} from "@/lib/marketplace-media";
import { compressImageIfNeeded } from "@/lib/uploads/compressImage";
import { validateFile } from "@/lib/uploads/validate";
import { cn } from "@/lib/utils";
import { IconTooltip } from "@/components/ui/tooltip";

const PRESS = MARKETPLACE_PRESS;

export type ListingMedia = {
  id: string;
  kind: "image" | "video";
  name: string;
  preview: string;
  file?: File;
};

let mediaSeq = 0;
function newId() {
  mediaSeq += 1;
  return `media-${Date.now()}-${mediaSeq}`;
}

export function remoteListingMedia(
  urls: string[],
  kind: ListingMedia["kind"],
): ListingMedia[] {
  return urls.map((url, index) => ({
    id: `remote-${kind}-${index}-${url}`,
    kind,
    name: getAttachmentFilename(url, index),
    preview: url,
  }));
}

function MediaPreview({ item }: Readonly<{ item: ListingMedia }>) {
  if (item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.preview}
        alt={item.name}
        className="h-28 w-full object-cover"
      />
    );
  }
  return (
    <video
      src={item.preview}
      muted
      playsInline
      preload="metadata"
      className="h-28 w-full object-cover"
    />
  );
}

type Props = Readonly<{
  items: ListingMedia[];
  maxImages: number;
  maxVideos: number;
  disabled?: boolean;
  onChange: (items: ListingMedia[]) => void;
}>;

export function MarketplaceMediaPicker({
  items,
  maxImages,
  maxVideos,
  disabled = false,
  onChange,
}: Props) {
  const inputId = useId();
  const imageCount = items.filter((item) => item.kind === "image").length;
  const videoCount = items.filter((item) => item.kind === "video").length;
  const imageRemaining = maxImages - imageCount;
  const videoRemaining = maxVideos - videoCount;
  const canAdd = imageRemaining > 0 || videoRemaining > 0;

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    let imageSlots = imageRemaining;
    let videoSlots = videoRemaining;
    const next = [...items];

    for (const raw of files) {
      const kind = marketplaceFileKind(raw);
      if (!kind) {
        toast.error(`${raw.name} is not a photo or video.`);
        continue;
      }
      if (kind === "image" && imageSlots <= 0) {
        toast.error(`You can add up to ${maxImages} photos.`);
        continue;
      }
      if (kind === "video" && videoSlots <= 0) {
        toast.error(`You can add up to ${maxVideos} videos.`);
        continue;
      }

      const validation = validateFile(raw, { kind });
      if (!validation.ok) {
        toast.error(validation.error);
        continue;
      }

      const file = kind === "image" ? await compressImageIfNeeded(raw) : raw;
      if (kind === "image") imageSlots -= 1;
      else videoSlots -= 1;
      next.push({
        id: newId(),
        kind,
        name: file.name,
        preview: URL.createObjectURL(file),
        file,
      });
    }

    onChange(next);
  };

  const removeItem = (item: ListingMedia) => {
    if (item.file) URL.revokeObjectURL(item.preview);
    onChange(items.filter((entry) => entry.id !== item.id));
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-2xl border border-black/5 bg-muted/40"
        >
          <MediaPreview item={item} />
          <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-[0.01em] text-white">
            {item.kind === "video" ? (
              <Video className="size-3" aria-hidden />
            ) : null}
            {item.kind === "video" ? "Video" : "Photo"}
          </span>
          <IconTooltip label={`Remove ${item.name}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn("absolute top-2 right-2 size-8 rounded-full", PRESS)}
              onClick={() => removeItem(item)}
              disabled={disabled}
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </IconTooltip>
        </div>
      ))}

      {canAdd ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-muted/20 px-4 py-5 text-center",
            "transition-colors hover:bg-muted/40",
            PRESS,
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="size-5 text-muted-foreground" />
          <span className="text-sm font-medium">Add photos or videos</span>
          <span className="text-xs text-muted-foreground">
            {imageRemaining} photos · {videoRemaining} videos left
          </span>
        </label>
      ) : null}
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={MARKETPLACE_MEDIA_ACCEPT}
        multiple
        disabled={disabled || !canAdd}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addFiles(files);
        }}
      />
    </div>
  );
}
