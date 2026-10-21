import { cn } from "@/lib/utils";
import {
  marketplaceStatusLabel,
  normalizeMarketplaceStatus,
} from "@/lib/marketplace";

export function MarketplaceStatusBadge({
  status,
  className,
}: Readonly<{
  status?: string;
  className?: string;
}>) {
  const normalized = normalizeMarketplaceStatus(status);
  const tone =
    normalized === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-700"
      : normalized === "PENDING_APPROVAL"
        ? "bg-amber-500/10 text-amber-800"
        : normalized === "REJECTED" || normalized === "SUSPENDED"
          ? "bg-red-500/10 text-red-700"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.01em]",
        tone,
        className,
      )}
    >
      {marketplaceStatusLabel(status)}
    </span>
  );
}
