"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const PROFILE_AVATAR_FALLBACK = "/profile.svg";

export function resolveProfileImage(src?: string | null) {
  const trimmed = src?.trim() ?? "";
  return trimmed || PROFILE_AVATAR_FALLBACK;
}

type UserAvatarProps = {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
};

type UserNameWithAvatarProps = {
  image?: string | null;
  name: string;
  size?: number;
};

export function UserAvatar({
  src,
  alt,
  size = 48,
  className,
}: Readonly<UserAvatarProps>) {
  const resolved = resolveProfileImage(src);
  const [imageSrc, setImageSrc] = useState(resolved);

  useEffect(() => {
    setImageSrc(resolveProfileImage(src));
  }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted",
        "ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* Native img: avatars come from Cloudinary, Spaces, or a data URI preview. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={imageSrc}
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        onError={() => {
          if (imageSrc !== PROFILE_AVATAR_FALLBACK) {
            setImageSrc(PROFILE_AVATAR_FALLBACK);
          }
        }}
      />
    </span>
  );
}

export function UserNameWithAvatar({
  image,
  name,
  size = 32,
}: Readonly<UserNameWithAvatarProps>) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserAvatar src={image} alt={name} size={size} />
      <span className="truncate">{name || "—"}</span>
    </div>
  );
}
