import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  IMAGE_ACCEPT_ATTR,
  VIDEO_ACCEPT_ATTR,
  inferFileMimeType,
  isAllowedMime,
} from "@/lib/uploads/constants";

export const MARKETPLACE_MEDIA_ACCEPT = `${IMAGE_ACCEPT_ATTR},${VIDEO_ACCEPT_ATTR}`;

export function marketplaceFileKind(file: File): "image" | "video" | null {
  const mime = inferFileMimeType(file);
  if (isAllowedMime(mime, ALLOWED_IMAGE_MIME_TYPES)) return "image";
  if (isAllowedMime(mime, ALLOWED_VIDEO_MIME_TYPES)) return "video";
  return null;
}

export function coverMedia(ad: {
  images?: string[];
  image?: string;
  videos?: string[];
}): { type: "image" | "video" | "none"; url: string } {
  const image = (ad.images ?? []).find((url) => url?.trim()) ?? ad.image?.trim();
  if (image) return { type: "image", url: image };
  const video = (ad.videos ?? []).find((url) => url?.trim());
  if (video) return { type: "video", url: video };
  return { type: "none", url: "" };
}

export function listingImages(ad: {
  images?: string[];
  image?: string;
}): string[] {
  const fromArray = (ad.images ?? []).map((url) => url.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const legacy = ad.image?.trim();
  return legacy ? [legacy] : [];
}

export function listingVideos(ad: { videos?: string[] }): string[] {
  return (ad.videos ?? []).map((url) => url.trim()).filter(Boolean);
}
