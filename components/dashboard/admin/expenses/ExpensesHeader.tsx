"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export interface ExpensesHeaderProps {
  title: string;
  estateName: string;
  showImage?:boolean;
  onAddExpense: () => void;
  actionLabel?: string;
}

export function ExpensesHeader({
  title,
  onAddExpense,
  showImage,
  actionLabel = "Add Expense",
}: Readonly<ExpensesHeaderProps>) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-2">
        {showImage && (
            <div className="bg-[#F2F2F2] p-3 rounded-full">
          <Image
            src="/arrow.svg"
            alt="Berta Hub"
            width={20}
            height={20}
            className="cursor-pointer hover:opacity-80"
            onClick={() => router.back()}
          />
          </div>
        )}
        <h1 className="font-heading text-3xl font-bold">{title}</h1>
      </div>

      <Button className="gap-2 self-start" onClick={onAddExpense}>
        <Plus className="h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}
