"use client";

import { CircleHelp } from "lucide-react";

type Props = {
  text: string;
  label?: string;
};

/** Question-mark hover/focus tooltip for short help copy. */
export function HelpTooltip({ text, label = "More information" }: Readonly<Props>) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[color,transform,background-color] duration-100 ease-out hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
        aria-label={label}
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {trimmed}
      </span>
    </span>
  );
}
