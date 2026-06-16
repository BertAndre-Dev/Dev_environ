"use client";

import React from "react";

import { Card } from "@/components/ui/card";

export interface TotalRevenueCardProps {
  total: number;
}

export function TotalRevenueCard({ total }: Readonly<TotalRevenueCardProps>) {
  return (
    <Card className="mt-0 p-6">
      <p className="text-sm text-muted-foreground">Total Revenue</p>
      <p className="text-4xl font-bold mt-2">₦{total.toLocaleString()}</p>
    </Card>
  );
}

