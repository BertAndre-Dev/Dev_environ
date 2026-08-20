import { Check } from "lucide-react";

import type { ReceiptInfoField, ReceiptViewModel } from "@/components/receipt/types";

const SUPPORT_PHONE = "+234 903 849 8288";
const SUPPORT_EMAIL = "support@bertahub.com";

function HeaderMeta({
  label,
  value,
}: Readonly<{ label: string; value?: string }>) {
  if (!value) return null;
  return (
    <p className="text-[11px] leading-4 tracking-[0.01em] text-[#6b7280]">
      {label}: <span className="text-[#111827]">{value}</span>
    </p>
  );
}

function InfoCell({ field }: Readonly<{ field: ReceiptInfoField }>) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] leading-4 tracking-[0.01em] text-[#6b7280]">
        {field.label}
      </p>
      <p className="mt-0.5 text-sm font-semibold leading-5 tracking-[-0.01em] text-[#111827] wrap-break-word">
        {field.value}
      </p>
    </div>
  );
}

function DetailRow({
  field,
  emphasize,
}: Readonly<{ field: ReceiptInfoField; emphasize?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[13px] leading-5 text-[#6b7280] shrink-0">
        {field.label}
      </span>
      <span
        className={[
          "text-right break-all leading-5",
          emphasize
            ? "text-sm font-bold tracking-[-0.01em] text-[#111827]"
            : "text-[13px] font-semibold text-[#111827]",
        ].join(" ")}
      >
        {field.value}
      </span>
    </div>
  );
}

const STATUS_TONE: Record<
  ReceiptViewModel["statusTone"],
  string
> = {
  success: "bg-[#dcfce7] text-[#15803d]",
  pending: "bg-[#fef3c7] text-[#b45309]",
  failed: "bg-[#fee2e2] text-[#b91c1c]",
};

export function ReceiptCard({
  receipt,
}: Readonly<{ receipt: ReceiptViewModel }>) {
  const billDetails = receipt.detailRows.filter(
    (row) => row.label !== "Amount Paid",
  );
  const amountRow =
    receipt.amountPaid
      ? { label: "Amount Paid", value: receipt.amountPaid }
      : receipt.detailRows.find((row) => row.label === "Amount Paid");

  return (
    <article
      className="w-full overflow-hidden bg-white text-[#111827]"
      style={{ backgroundColor: "#ffffff", color: "#111827" }}
    >
      <div className="px-6 pt-6 pb-4 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/trustedby/logo.svg"
            alt="Berta Hub"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <div className="text-right">
            <p className="text-2xl font-semibold leading-none tracking-[-0.02em]">
              Receipt
            </p>
            <div className="mt-2 space-y-0.5">
              <HeaderMeta label="Receipt No." value={receipt.receiptNo} />
              <HeaderMeta label="Receipt Date" value={receipt.receiptDate} />
              <HeaderMeta label="Due Date" value={receipt.dueDate} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#e5e7eb]" />

      <div className="flex items-start justify-between gap-3 px-6 py-4 sm:px-8">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-tight tracking-[0.04em] uppercase">
            {receipt.title}
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[#6b7280]">
            {receipt.subtitle}
          </p>
        </div>
        <span
          className={[
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em]",
            STATUS_TONE[receipt.statusTone],
          ].join(" ")}
        >
          {receipt.statusTone === "success" ? (
            <Check className="size-3" strokeWidth={3} aria-hidden />
          ) : null}
          {receipt.statusLabel}
        </span>
      </div>

      {receipt.type === "vend" && (receipt.receiptNo || receipt.receiptDate) ? (
        <>
          <div className="h-px bg-[#e5e7eb]" />
          <div className="grid grid-cols-2 px-6 sm:px-8">
            <div className="py-3 pr-4">
              <p className="text-[11px] leading-4 text-[#6b7280]">Receipt no.</p>
              <p className="mt-0.5 text-sm font-bold tracking-[-0.01em] break-all">
                {receipt.receiptNo || "—"}
              </p>
            </div>
            <div className="border-l border-[#e5e7eb] py-3 pl-4">
              <p className="text-[11px] leading-4 text-[#6b7280]">Receipt Date.</p>
              <p className="mt-0.5 text-sm font-bold tracking-[-0.01em]">
                {receipt.receiptDate || "—"}
              </p>
            </div>
          </div>
        </>
      ) : null}

      {receipt.infoFields.length > 0 ? (
        <>
          <div className="h-px bg-[#e5e7eb]" />
          <div className="px-6 py-4 sm:px-8">
            <h3 className="text-[11px] font-semibold tracking-[0.08em] text-[#6b7280]">
              {receipt.infoTitle}
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              {receipt.infoFields.map((field) => (
                <InfoCell key={field.label} field={field} />
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="h-px bg-[#e5e7eb]" />

      <div className="px-6 py-4 sm:px-8">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-[#6b7280]">
          {receipt.detailTitle}
        </h3>

        {receipt.type === "vend" ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              {receipt.detailRows.map((field) => (
                <DetailRow
                  key={field.label}
                  field={field}
                  emphasize={field.label === "Amount Paid"}
                />
              ))}
            </div>
            <div>
              {receipt.receiptNo ? (
                <div className="mb-3">
                  <p className="text-[11px] leading-4 text-[#6b7280]">
                    Receipt Number
                  </p>
                  <p className="mt-0.5 text-sm font-bold tracking-[-0.01em] break-all">
                    {receipt.receiptNo}
                  </p>
                </div>
              ) : null}
              {receipt.token ? (
                <div>
                  <p className="text-[11px] leading-4 text-[#6b7280]">Token</p>
                  <div
                    className="mt-1.5 rounded-md px-3 py-3 text-center"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <p className="font-mono text-base font-semibold tracking-[0.18em] text-[#0A387E] break-all">
                      {receipt.token}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-1">
            {billDetails.map((field) => (
              <DetailRow key={field.label} field={field} />
            ))}
            {amountRow ? <DetailRow field={amountRow} emphasize /> : null}
          </div>
        )}

        {receipt.type === "vend" && receipt.summary ? (
          <div className="mt-5 overflow-hidden rounded-md border border-[#e5e7eb]">
            <table className="w-full text-left text-[11px]">
              <thead style={{ backgroundColor: "#f3f4f6" }}>
                <tr className="text-[#4b5563]">
                  <th className="px-2.5 py-2 font-medium">Units Bought (KWh)</th>
                  <th className="px-2.5 py-2 font-medium">Amount Paid (N)</th>
                  <th className="px-2.5 py-2 font-medium">Price Per Unit (N)</th>
                  <th className="px-2.5 py-2 font-medium">Total (N)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-[#111827]">
                  <td className="px-2.5 py-2 font-semibold">
                    {receipt.summary.unitsBought}
                  </td>
                  <td className="px-2.5 py-2 font-semibold">
                    {receipt.summary.amountPaid}
                  </td>
                  <td className="px-2.5 py-2 font-semibold">
                    {receipt.summary.pricePerUnit}
                  </td>
                  <td className="px-2.5 py-2 font-semibold">
                    {receipt.summary.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="px-6 pb-5 sm:px-8">
        <div
          className="grid gap-4 rounded-md px-4 py-3 sm:grid-cols-2"
          style={{ backgroundColor: "#eff6ff" }}
        >
          <div>
            <p className="text-[12px] font-semibold text-[#0150AC]">
              Important Notice
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#4b5563]">
              This receipt confirms the transaction recorded on Berta Hub. Keep
              it for your records.
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#0150AC]">Need Help?</p>
            <p className="mt-1 text-[11px] leading-4 text-[#4b5563]">
              Phone: {SUPPORT_PHONE}
              <br />
              Email: {SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      </div>

      <div
        className="px-6 py-2.5 text-center text-[11px] font-medium tracking-[0.04em] text-white"
        style={{ backgroundColor: "#0150AC" }}
      >
        Building Sustainable Communities
      </div>
    </article>
  );
}
