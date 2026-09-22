"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MARKETPLACE_PRESS } from "@/lib/marketplace";
import { cn } from "@/lib/utils";

export type EstateOption = { label: string; value: string };

type Props = Readonly<{
  options: EstateOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}>;

export function MarketplaceEstatePicker({
  options,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  };

  const visibleIds = filtered.map((option) => option.value);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => value.includes(id));

  const selectAllVisible = () => {
    if (disabled || visibleIds.length === 0) return;
    onChange([...new Set([...value, ...visibleIds])]);
  };

  const clearVisible = () => {
    if (disabled) return;
    const hide = new Set(visibleIds);
    onChange(value.filter((id) => !hide.has(id)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search estates"
            className="h-11 rounded-xl pl-9"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={allVisibleSelected ? clearVisible : selectAllVisible}
          disabled={disabled || visibleIds.length === 0}
          className={cn(
            "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40",
            MARKETPLACE_PRESS,
          )}
        >
          {allVisibleSelected ? "Clear" : "Select all"}
        </button>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary",
                MARKETPLACE_PRESS,
              )}
            >
              {option.label}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">Remove {option.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Search and tap estates to include them.
        </p>
      )}

      <div className="max-h-56 overflow-y-auto rounded-2xl border border-black/5 bg-muted/20">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No estates match that search.
          </p>
        ) : (
          filtered.map((option) => {
            const isOn = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm",
                  MARKETPLACE_PRESS,
                  isOn ? "bg-primary/10 font-medium" : "hover:bg-muted/60",
                )}
              >
                <span className="truncate">{option.label}</span>
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isOn
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-transparent",
                  )}
                >
                  <Check className="size-3" aria-hidden />
                </span>
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected.length} selected
      </p>
    </div>
  );
}
