"use client";

import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Shared invite phone field with a help affordance for WhatsApp preference.
 */
export default function InvitePhoneNumberField({
  id,
  value,
  onChange,
  required = true,
  disabled,
  className,
}: Readonly<Props>) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-1.5">
        <Label htmlFor={id} className="mb-0">
          Phone number
        </Label>
        <span className="relative inline-flex group">
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[color,transform,background-color] duration-100 ease-out hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
            aria-label="WhatsApp number preferred"
            aria-describedby={`${id}-whatsapp-hint`}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
          <span
            id={`${id}-whatsapp-hint`}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
          >
            WhatsApp number preferred for.
          </span>
        </span>
      </div>
      <Input
        id={id}
        name="phoneNumber"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={onChange}
        placeholder="e.g. 8100001427"
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
