"use client";

import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { PHONE_E164_EXAMPLE } from "@/lib/phone-e164";

type Props = {
  id: string;
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (countryCode: string) => void;
  onPhoneNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Invite phone field: country code + national number, with WhatsApp hint.
 */
export default function InvitePhoneNumberField({
  id,
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = true,
  disabled,
  className,
}: Readonly<Props>) {
  const countryId = `${id}-country`;
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={countryId}>Country code</Label>
          <CountryCodeSelect
            id={countryId}
            value={countryCode}
            onChange={onCountryCodeChange}
            disabled={disabled}
            placeholder="+234"
            className="mt-1"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Label htmlFor={id} className="mb-0">
              WhatsApp phone number
            </Label>
            <span className="relative inline-flex group">
              <button
                type="button"
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-[color,transform,background-color] duration-100 ease-out hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95"
                aria-label="WhatsApp number preferred for notifications"
              >
                <CircleHelp className="size-3.5" aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
              >
                WhatsApp number preferred for notifications.
              </span>
            </span>
          </div>
          <Input
            id={id}
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phoneNumber}
            onChange={onPhoneNumberChange}
            placeholder="8100001427"
            required={required}
            disabled={disabled}
            aria-describedby={`${id}-whatsapp-hint`}
          />
        </div>
      </div>
      <p
        id={`${id}-whatsapp-hint`}
        className="mt-1.5 text-sm font-medium leading-snug text-muted-foreground"
      >
        Include the country code. Example: {PHONE_E164_EXAMPLE}. Do not start
        with 0.
      </p>
    </div>
  );
}
