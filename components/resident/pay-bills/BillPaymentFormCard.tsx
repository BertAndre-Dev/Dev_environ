"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type {
  BillsCategory,
  BillsBiller,
  BillsItem,
} from "@/redux/slice/resident/bills-payment/bills-payment";
import type { ResidentBillsPaymentState } from "@/redux/slice/resident/bills-payment/bills-payment-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PinInputRow } from "@/components/resident/pay-bills/SetUpPinCard";
import { cn } from "@/lib/utils";

const STEP_SPRING = { type: "spring" as const, bounce: 0, duration: 0.35 };

const COUNTRY_OPTIONS = [
  { label: "Nigeria", value: "NG" },
  { label: "Ghana", value: "GH" },
  { label: "Kenya", value: "KE" },
  { label: "Uganda", value: "UG" },
] as const;

function countryLabel(code: string) {
  return COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code;
}

function resolveCategoryCode(c: BillsCategory) {
  return (
    (c.category_code as string) ||
    (c.code as string) ||
    (c.product as string) ||
    ""
  );
}
function resolveCategoryName(c: BillsCategory) {
  return (
    (c.name as string) || (c.label as string) || resolveCategoryCode(c) || "—"
  );
}
function resolveBillerCode(b: BillsBiller) {
  return (b.biller_code as string) || (b.code as string) || "";
}
function resolveBillerName(b: BillsBiller) {
  return (
    (b.name as string) ||
    (b.label as string) ||
    (b.short_name as string) ||
    resolveBillerCode(b) ||
    "—"
  );
}
function resolveItemCode(i: BillsItem) {
  return (
    (i.item_code as string) ||
    (i.code as string) ||
    (i.service_type as string) ||
    ""
  );
}
function resolveItemName(i: BillsItem) {
  return (i.name as string) || (i.label as string) || resolveItemCode(i) || "—";
}

/** Keep first row per non-empty code so `<option value>` stays unique in native selects. */
function dedupeByResolvedCode<T>(items: T[], codeFn: (row: T) => string): T[] {
  const seen = new Set<string>();
  let keptEmptyCode = false;
  const out: T[] = [];
  for (const row of items) {
    const code = codeFn(row).trim();
    if (!code) {
      if (!keptEmptyCode) {
        keptEmptyCode = true;
        out.push(row);
      }
      continue;
    }
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(row);
  }
  return out;
}

export type BillPaymentFormCardProps = Readonly<{
  billsPayment: ResidentBillsPaymentState;
  country: string;
  onCountryChange: (value: string) => void;
  categoryCode: string;
  onCategoryChange: (value: string) => void;
  billerCode: string;
  onBillerChange: (value: string) => void;
  itemCode: string;
  onItemChange: (value: string) => void;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  billRef: string;
  onBillRefChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  pin: string;
  onPinChange: (value: string) => void;
  onPay: () => void;
}>;

const STEPS = [
  {
    id: 1,
    label: "Service",
    title: "What are you paying?",
    description: "Choose a category, provider, and plan.",
  },
  {
    id: 2,
    label: "Details",
    title: "Account and amount",
    description: "Enter the ID this payment is for.",
  },
  {
    id: 3,
    label: "Pay",
    title: "Confirm and pay",
    description: "Check the details, then authorise with your PIN.",
  },
] as const;

function StepRail({
  current,
  onGoTo,
}: {
  current: number;
  onGoTo: (id: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="navigation"
      aria-label="Payment steps"
    >
      {STEPS.map((step) => {
        const done = current > step.id;
        const active = current === step.id;
        const reachable = step.id <= current;
        return (
          <button
            key={step.id}
            type="button"
            disabled={!reachable}
            onClick={() => reachable && onGoTo(step.id)}
            aria-current={active ? "step" : undefined}
            aria-label={`${step.label}${active ? ", current" : done ? ", completed" : ""}`}
            className={cn(
              "h-1 flex-1 rounded-full transition-[background-color,transform] duration-100 ease-out",
              "active:scale-[0.98] disabled:active:scale-100",
              done || active ? "bg-primary" : "bg-border",
              reachable ? "cursor-pointer" : "cursor-default",
            )}
          />
        );
      })}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
      {children}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right text-sm font-medium text-foreground",
          highlight &&
            "text-[1.35rem] font-semibold tracking-[-0.02em] text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BillPaymentFormCard({
  billsPayment,
  country,
  onCountryChange,
  categoryCode,
  onCategoryChange,
  billerCode,
  onBillerChange,
  itemCode,
  onItemChange,
  customerId,
  onCustomerIdChange,
  amount,
  onAmountChange,
  pin,
  onPinChange,
  onPay,
}: BillPaymentFormCardProps) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [countryOpen, setCountryOpen] = useState(country !== "NG");

  const current = STEPS.find((s) => s.id === step) ?? STEPS[0];

  const categoriesUnique = useMemo(
    () =>
      dedupeByResolvedCode(
        billsPayment.categories ?? [],
        resolveCategoryCode,
      ).filter((c) => resolveCategoryCode(c) !== "UTILITYBILLS"),
    [billsPayment.categories],
  );
  const billersUnique = useMemo(
    () => dedupeByResolvedCode(billsPayment.billers ?? [], resolveBillerCode),
    [billsPayment.billers],
  );
  const itemsUnique = useMemo(
    () => dedupeByResolvedCode(billsPayment.items ?? [], resolveItemCode),
    [billsPayment.items],
  );

  const selectedCategory = categoriesUnique.find(
    (c) => resolveCategoryCode(c) === categoryCode,
  );
  const selectedBiller = billersUnique.find(
    (b) => resolveBillerCode(b) === billerCode,
  );
  const selectedItem = itemsUnique.find((i) => resolveItemCode(i) === itemCode);

  const pinDigits = useMemo(
    () => Array.from({ length: 4 }, (_, i) => pin[i] ?? ""),
    [pin],
  );

  const step1Valid = Boolean(categoryCode && billerCode && itemCode);
  const step2Valid = Boolean(customerId.trim() && amount && Number(amount) > 0);
  const paying = billsPayment.payStatus === "isLoading";
  const amountLabel = `₦${Number(amount || 0).toLocaleString()}`;

  function goTo(next: number) {
    if (next === step) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const stepMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, x: direction * 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: direction * -28 },
      };

  const actionClass =
    "h-12 active:scale-[0.97] motion-reduce:active:scale-100";

  const renderStep1 = () => (
    <div className="space-y-5">
      {countryOpen ? (
        <div>
          <FieldLabel htmlFor="bills-country">Country</FieldLabel>
          <Select
            id="bills-country"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            options={COUNTRY_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCountryOpen(true)}
          className="text-sm text-muted-foreground transition-opacity duration-100 hover:text-foreground active:scale-[0.99]"
        >
          Paying in {countryLabel(country)}
          <span className="ml-1.5 font-medium text-primary">Change</span>
        </button>
      )}

      <div>
        <FieldLabel htmlFor="bills-category">Category</FieldLabel>
        <Select
          id="bills-category"
          value={categoryCode}
          onChange={(e) => onCategoryChange(e.target.value)}
          disabled={billsPayment.getCategoriesStatus === "isLoading"}
          options={[
            {
              label:
                billsPayment.getCategoriesStatus === "isLoading"
                  ? "Loading categories…"
                  : "Select a category",
              value: "",
            },
            ...categoriesUnique.map((c) => ({
              label: resolveCategoryName(c),
              value: resolveCategoryCode(c),
            })),
          ]}
        />
      </div>

      <div>
        <FieldLabel htmlFor="bills-biller">Provider</FieldLabel>
        <Select
          id="bills-biller"
          value={billerCode}
          onChange={(e) => onBillerChange(e.target.value)}
          disabled={
            !categoryCode || billsPayment.getBillersStatus === "isLoading"
          }
          options={[
            {
              label: !categoryCode
                ? "Select a category first"
                : billsPayment.getBillersStatus === "isLoading"
                  ? "Loading providers…"
                  : "Select a provider",
              value: "",
            },
            ...billersUnique.map((b) => ({
              label: resolveBillerName(b),
              value: resolveBillerCode(b),
            })),
          ]}
        />
      </div>

      <div>
        <FieldLabel htmlFor="bills-item">Plan</FieldLabel>
        <Select
          id="bills-item"
          value={itemCode}
          onChange={(e) => {
            const code = e.target.value;
            onItemChange(code);
            const item = itemsUnique.find((i) => resolveItemCode(i) === code);
            if (item?.amount != null && Number.isFinite(Number(item.amount))) {
              onAmountChange(String(item.amount));
            }
          }}
          disabled={!billerCode || billsPayment.getItemsStatus === "isLoading"}
          options={[
            {
              label: !billerCode
                ? "Select a provider first"
                : billsPayment.getItemsStatus === "isLoading"
                  ? "Loading plans…"
                  : "Select a plan",
              value: "",
            },
            ...itemsUnique.map((i) => ({
              label:
                i?.amount == null
                  ? resolveItemName(i)
                  : `${resolveItemName(i)} — ${i.currency ?? "₦"}${Number(i.amount).toLocaleString()}`,
              value: resolveItemCode(i),
            })),
          ]}
        />
      </div>

      <Button
        type="button"
        className={cn("w-full", actionClass)}
        disabled={!step1Valid}
        onClick={() => goTo(2)}
      >
        Continue
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => goTo(1)}
        className="flex w-full items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-3 text-left text-sm transition-transform duration-100 ease-out active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1 truncate font-medium">
          {selectedCategory ? resolveCategoryName(selectedCategory) : "Service"}
          <span className="font-normal text-muted-foreground">
            {selectedBiller ? ` · ${resolveBillerName(selectedBiller)}` : ""}
            {selectedItem ? ` · ${resolveItemName(selectedItem)}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-primary">Edit</span>
      </button>

      <div>
        <FieldLabel htmlFor="bills-customer-id">Customer ID</FieldLabel>
        <Input
          id="bills-customer-id"
          value={customerId}
          onChange={(e) => onCustomerIdChange(e.target.value)}
          placeholder="Phone, meter, or decoder number"
          className="h-11"
        />
        <FieldHint>
          The ID this payment is for.
        </FieldHint>
      </div>

      <div>
        <FieldLabel htmlFor="bills-amount">Amount</FieldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            ₦
          </span>
          <Input
            id="bills-amount"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            inputMode="numeric"
            placeholder="0.00"
            className="h-11 pl-7"
          />
        </div>
        {selectedItem?.amount != null && (
          <FieldHint>
            Plan amount is ₦{Number(selectedItem.amount).toLocaleString()}. You
            can change it if you need to.
          </FieldHint>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className={cn("flex-1", actionClass)}
          onClick={() => goTo(1)}
        >
          Back
        </Button>
        <Button
          type="button"
          className={cn("flex-1", actionClass)}
          disabled={!step2Valid}
          onClick={() => goTo(3)}
        >
          Review
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-muted/50 px-4 py-3">
        <SummaryRow
          label="Category"
          value={
            selectedCategory ? resolveCategoryName(selectedCategory) : "—"
          }
        />
        <SummaryRow
          label="Provider"
          value={selectedBiller ? resolveBillerName(selectedBiller) : "—"}
        />
        <SummaryRow
          label="Plan"
          value={selectedItem ? resolveItemName(selectedItem) : "—"}
        />
        <SummaryRow label="Customer ID" value={customerId} />
        {selectedItem?.fee != null && (
          <SummaryRow
            label="Service fee"
            value={`${selectedItem.currency ?? "₦"}${Number(selectedItem.fee).toLocaleString()}`}
          />
        )}
        <div className="mt-1 border-t border-border/80 pt-1">
          <SummaryRow label="Total" value={amountLabel} highlight />
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-medium text-foreground">
          Enter your PIN
        </p>
        <PinInputRow
          label="PIN"
          hideLabel
          digits={pinDigits}
          onChange={(next) => onPinChange(next.join(""))}
          autoFocusFirst
          disabled={paying}
        />
        <FieldHint>The 4-digit PIN you created for payments.</FieldHint>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className={cn("flex-1", actionClass)}
          onClick={() => goTo(2)}
          disabled={paying}
        >
          Back
        </Button>
        <Button
          type="button"
          className={cn("flex-1", actionClass)}
          onClick={onPay}
          disabled={paying || pin.trim().length !== 4}
        >
          {paying ? "Paying…" : `Pay ${amountLabel}`}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="p-6 sm:p-7">
      <CardHeader className="space-y-4 px-0 pb-0">
        <div>
          <p className="text-sm text-muted-foreground">
            {step} of {STEPS.length}
          </p>
          <CardTitle className="mt-1 text-[1.65rem] font-semibold leading-tight tracking-[-0.02em]">
            {current.title}
          </CardTitle>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
            {current.description}
          </p>
        </div>
        <StepRail current={step} onGoTo={goTo} />
      </CardHeader>

      <CardContent className="overflow-hidden px-0 pt-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            initial={stepMotion.initial}
            animate={stepMotion.animate}
            exit={stepMotion.exit}
            transition={STEP_SPRING}
            className="will-change-transform"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
