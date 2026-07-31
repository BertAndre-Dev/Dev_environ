"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";

type Props = {
  estateName: string;
  disabled?: boolean;
  onSeeVendLimit?: () => void;
  onSetVendLimit?: () => void;
};

export function TransactionsPageHeader({
  estateName,
  disabled,
  onSeeVendLimit,
  onSetVendLimit,
}: Readonly<Props>) {
  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-start md:items-center justify-between">
      <div>
        <h1 className="font-heading text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's is an overview on{" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName}
          </span>
          {"."}
        </p>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            disabled={disabled}
            className="flex items-center gap-2 cursor-pointer"
          >
            Vend Limit
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[200px] rounded-md border bg-white p-1 shadow-md"
          >
            <DropdownMenu.Item
              onSelect={() => onSeeVendLimit?.()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              See vend limit
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => onSetVendLimit?.()}
              className="cursor-pointer select-none rounded px-3 py-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
            >
              Set / update vend limit
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
