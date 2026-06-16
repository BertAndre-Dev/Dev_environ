"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { labelForEstateModule } from "@/lib/estate-module-labels";

type ModuleSelectionChipsProps = {
  availableModules: string[];
  selectedModules: string[];
  onChange: (modules: string[]) => void;
  getLabel?: (key: string) => string;
};

export function ModuleSelectionChips({
  availableModules,
  selectedModules,
  onChange,
  getLabel = labelForEstateModule,
}: Readonly<ModuleSelectionChipsProps>) {
  const selectAllName = useId();
  const chipGroupId = useId();

  const allSelected =
    availableModules.length > 0 &&
    availableModules.every((key) => selectedModules.includes(key));

  const toggleModule = (key: string) => {
    const next = new Set(selectedModules);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  };

  const chipClass = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
      selected
        ? "border-primary bg-primary/10 text-primary font-medium"
        : "border-border bg-background hover:bg-muted/50 text-foreground",
    );

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none w-fit">
        <input
          type="radio"
          name={selectAllName}
          checked={allSelected}
          onChange={() => onChange([...availableModules])}
          className="cursor-pointer"
        />
        Select all
      </label>

      <div className="flex flex-wrap gap-2">
        {availableModules.map((key) => {
          const selected = selectedModules.includes(key);
          const inputId = `${chipGroupId}-${key}`;
          return (
            <label
              key={key}
              htmlFor={inputId}
              className={chipClass(selected)}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={selected}
                onChange={() => toggleModule(key)}
                className="sr-only"
              />
              {getLabel(key)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
