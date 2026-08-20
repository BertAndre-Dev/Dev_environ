"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (next: boolean) => void;
};

export function DesignationToggle({
  checked,
  disabled,
  label,
  onCheckedChange,
}: Readonly<Props>) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-sm tracking-[0.01em]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.style.transform = "scale(0.97)";
        }}
        onPointerUp={(event) => {
          event.currentTarget.style.transform = "";
        }}
        onPointerCancel={(event) => {
          event.currentTarget.style.transform = "";
        }}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
          "transition-[background-color] duration-100 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0150AC]/40",
          "disabled:opacity-40 disabled:pointer-events-none",
          checked ? "bg-[#0150AC]" : "bg-black/15",
        )}
      >
        <motion.span
          className="block size-6 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", bounce: 0, duration: 0.32 }
          }
        />
      </button>
    </div>
  );
}
