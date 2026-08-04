"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CopyButton } from "@/components/ui/copy-button";
import { selectResidentCode } from "@/redux/slice/auth-mgt/auth-mgt-slice";

export function VisitorPageHeader({
  onAddVisitor,
  onAddOccupant,
  disabled,
  disabledReason,
}: Readonly<{
  onAddVisitor: () => void;
  onAddOccupant: () => void;
  disabled?: boolean;
  disabledReason?: string;
}>) {
  const residentCode = useSelector(selectResidentCode);
  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Visitor Management</h1>
        {residentCode ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground bg-primary/10 rounded-md p-4">
            <span>Your resident code:</span>
            <span className="font-mono font-semibold text-foreground">
              {residentCode}
            </span>
            <CopyButton
              value={residentCode}
              title="Copy resident code"
            />
          </div>
        ) : null}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[180px] rounded-md border bg-white p-1 shadow-md"
          >
            <DropdownMenu.Item
              onSelect={() => onAddVisitor()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Invite Visitors
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => onAddOccupant()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Add Occupant
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

