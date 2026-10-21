"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketplaceStatusBadge } from "@/components/marketplace/MarketplaceStatusBadge";
import { MARKETPLACE_PRESS, marketplaceAudienceLabel } from "@/lib/marketplace";
import { listingImages, listingVideos } from "@/lib/marketplace-media";
import type { MarketplaceAd } from "@/redux/slice/marketplace/marketplace";
import { cn } from "@/lib/utils";

export function MarketplaceAdDetail({
  item,
  showStatus = false,
}: Readonly<{
  item: MarketplaceAd;
  showStatus?: boolean;
}>) {
  const images = listingImages(item);
  const videos = listingVideos(item);
  const [activeImage, setActiveImage] = useState(0);
  const hero = images[activeImage] ?? images[0];

  return (
    <div className="space-y-5 pr-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {item.productCategory ?? "Listing"}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
            {item.productName ?? "—"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.companyName}
          </p>
        </div>
        {showStatus ? <MarketplaceStatusBadge status={item.status} /> : null}
      </div>

      {hero ? (
        <div className="overflow-hidden rounded-2xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            className="max-h-72 w-full object-cover"
          />
        </div>
      ) : null}

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(index)}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-xl ring-2",
                MARKETPLACE_PRESS,
                index === activeImage ? "ring-primary" : "ring-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-14 object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {videos.length ? (
        <div className="space-y-3">
          {videos.map((url) => (
            <video
              key={url}
              src={url}
              controls
              className="w-full rounded-2xl bg-black"
            />
          ))}
        </div>
      ) : null}

      <p className="text-[15px] leading-relaxed text-foreground">
        {item.productDescription}
      </p>

      <p className="text-xs text-muted-foreground">
        {marketplaceAudienceLabel(item.audience)}
        {item.startDate && item.endDate
          ? ` · ${String(item.startDate).slice(0, 10)} – ${String(item.endDate).slice(0, 10)}`
          : ""}
      </p>

      {item.rejectionReason ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {item.rejectionReason}
        </p>
      ) : null}

      {item.link ? (
        <Button asChild className={cn("h-12 w-full rounded-xl", MARKETPLACE_PRESS)}>
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            Visit listing
            <ExternalLink className="size-4" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}
