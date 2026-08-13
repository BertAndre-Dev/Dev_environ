"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTransactionAmount } from "@/lib/transaction-summary-chart";
import type { TransactionSummary } from "@/types/analytics";

/** Success/teal — same paid/credit token as bills-status donut. */
const CREDIT_BAR_COLOR = "#2D9C6C";
/** Warning/coral — same pending token as bills-status donut. */
const DEBIT_BAR_COLOR = "#F99C52";

type DebitsCreditsBarProps = Readonly<{
  data: TransactionSummary;
  className?: string;
}>;

type BarRowProps = Readonly<{
  label: string;
  amount: number;
  widthPercent: number;
  color: string;
}>;

function BarRow({ label, amount, widthPercent, color }: BarRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatTransactionAmount(amount)}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export function DebitsCreditsBar({ data, className }: DebitsCreditsBarProps) {
  const credits = Math.max(0, Number(data.totalCredits ?? 0));
  const debits = Math.max(0, Number(data.totalDebits ?? 0));
  const larger = Math.max(credits, debits);
  const creditWidth = larger > 0 ? (credits / larger) * 100 : 0;
  const debitWidth = larger > 0 ? (debits / larger) * 100 : 0;

  return (
    <Card
      className={cn(
        "mt-0 gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          Credits vs Debits
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Amounts scaled to the larger of the two
        </p>
      </div>
      <div className="space-y-5 px-6 py-6">
        <BarRow
          label="Credits"
          amount={credits}
          widthPercent={creditWidth}
          color={CREDIT_BAR_COLOR}
        />
        <BarRow
          label="Debits"
          amount={debits}
          widthPercent={debitWidth}
          color={DEBIT_BAR_COLOR}
        />
      </div>
    </Card>
  );
}

export default DebitsCreditsBar;
