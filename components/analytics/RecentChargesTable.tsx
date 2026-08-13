"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { RecentCharge } from "@/types/analytics";

type TableRow = RecentCharge & { id: string };

type RecentChargesTableProps = Readonly<{
  charges: RecentCharge[];
  className?: string;
}>;

export function RecentChargesTable({
  charges,
  className,
}: RecentChargesTableProps) {
  const rows = useMemo<TableRow[]>(
    () =>
      charges.slice(0, 5).map((charge) => ({
        ...charge,
        id: charge._id,
      })),
    [charges],
  );

  const columns = useMemo(
    () => [
      {
        key: "chargeType",
        header: "Charge type",
        render: (item: TableRow) => item.chargeType || "—",
      },
      {
        key: "description",
        header: "Description",
        render: (item: TableRow) => (
          <span className="block max-w-60 truncate normal-case" title={item.description}>
            {item.description || "—"}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        render: (item: TableRow) =>
          formatTransactionAmount(Number(item.amount ?? 0)),
      },
      {
        key: "createdAt",
        header: "Date",
        render: (item: TableRow) => formatDateTime(item.createdAt),
      },
      {
        key: "type",
        header: "Type",
        render: (item: TableRow) =>
          item.type === "credit" ? (
            <span className="font-medium text-green-600">Credit</span>
          ) : (
            <span className="font-medium text-red-600">Debit</span>
          ),
      },
    ],
    [],
  );

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Recent charges
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest fee entries
        </p>
      </div>
      <div className="p-4">
        <Table
          columns={columns}
          data={rows}
          emptyMessage="No recent charges yet."
          showPagination={false}
        />
      </div>
    </Card>
  );
}

export default RecentChargesTable;
