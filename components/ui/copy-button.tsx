"use client";

import React from "react";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { IconTooltip } from "@/components/ui/tooltip";

export function CopyButton({
  value,
  label = "",
  copiedLabel = "Copied",
  title,
  copiedMessage,
  className,
}: Readonly<{
  value: string;
  label?: string;
  copiedLabel?: string;
  title?: string;
  /** Optional: overrides the modal success message (e.g. "Visitor code copied"). */
  copiedMessage?: string;
  className?: string;
}>) {
  const [copied, setCopied] = React.useState(false);

  const computedCopiedMessage = React.useMemo(() => {
    if (copiedMessage?.trim()) return copiedMessage.trim();
    const source = (title ?? label ?? "").trim();
    if (!source) return "Copied.";
    const lower = source.toLowerCase();
    if (lower.startsWith("copy ")) {
      const rest = source.slice(5).trim();
      if (!rest) return "Copied.";
      return `${rest.charAt(0).toUpperCase()}${rest.slice(1)} copied`;
    }
    return "Copied.";
  }, [copiedMessage, title, label]);

  const onCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(computedCopiedMessage);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No fallback UI required
    }
  };

  const accessibleName = (title ?? label ?? "Copy").trim() || "Copy";
  const isIconOnly = !label.trim();

  const button = (
    <button
      type="button"
      onClick={onCopy}
      className={[
        "inline-flex items-center gap-1 rounded py-1 text-xs font-medium cursor-pointer",
        "text-primary cursor-pointer",
        className ?? "",
      ].join(" ")}
      aria-label={accessibleName}
    >
      {copied ? (
        <>
          <CheckCircle className="h-3.5 w-3.5" />
          {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );

  return (
    <>
      {isIconOnly ? (
        <IconTooltip label={accessibleName}>{button}</IconTooltip>
      ) : (
        button
      )}
    </>
  );
}
