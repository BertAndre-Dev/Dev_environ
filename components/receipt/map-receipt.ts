import type { EnergyListItem } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
import {
  formatFrequencyLabel,
  formatReceiptDate,
  formatReceiptDateTime,
  formatReceiptNaira,
  formatTokenGroups,
  sanitizeFileBase,
} from "@/components/receipt/format";
import type {
  PaidBillReceiptSource,
  ReceiptInfoField,
  ReceiptParty,
  ReceiptViewModel,
} from "@/components/receipt/types";

function pushField(
  fields: ReceiptInfoField[],
  label: string,
  value?: string | null,
) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  fields.push({ label, value: trimmed });
}

function extraString(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function billStatus(status?: string): Pick<ReceiptViewModel, "statusLabel" | "statusTone"> {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "paid" || normalized === "successful" || normalized === "success") {
    return { statusLabel: "PAYMENT SUCCESSFUL", statusTone: "success" };
  }
  if (normalized === "failed") {
    return { statusLabel: "PAYMENT FAILED", statusTone: "failed" };
  }
  if (normalized === "pending") {
    return { statusLabel: "PAYMENT PENDING", statusTone: "pending" };
  }
  if (status?.trim()) {
    return { statusLabel: status.trim().toUpperCase(), statusTone: "pending" };
  }
  return { statusLabel: "PAYMENT SUCCESSFUL", statusTone: "success" };
}

export function mapBillReceipt(
  bill: PaidBillReceiptSource,
  party: ReceiptParty = {},
): ReceiptViewModel {
  const source = bill as PaidBillReceiptSource & Record<string, unknown>;
  const transactionId = extraString(source, ["tx_ref", "transactionId"]);
  const paymentDate =
    formatReceiptDateTime(bill.lastPaymentDate) ??
    formatReceiptDate(bill.lastPaymentDate) ??
    formatReceiptDateTime(bill.createdAt) ??
    formatReceiptDate(bill.createdAt);
  const amountPaid = formatReceiptNaira(bill.amountPaid);
  const billName = bill.billName?.trim();
  const { statusLabel, statusTone } = billStatus(bill.status);

  const infoFields: ReceiptInfoField[] = [];
  pushField(infoFields, "Resident Name", party.payerName);
  pushField(infoFields, "Estate", party.estateName);
  pushField(infoFields, "Email Address", party.email);
  pushField(infoFields, "Unit / House No.", party.addressLabel);

  const detailRows: ReceiptInfoField[] = [];
  pushField(detailRows, "Bill Paid For", billName);
  pushField(detailRows, "Frequency of Payment", formatFrequencyLabel(bill.frequency));
  pushField(detailRows, "Start Date", formatReceiptDate(bill.startDate) ?? formatReceiptDateTime(bill.startDate));
  pushField(detailRows, "Next Due Date", formatReceiptDate(bill.nextDueDate) ?? formatReceiptDateTime(bill.nextDueDate));
  pushField(detailRows, "Payment Date", paymentDate);
  pushField(detailRows, "Transaction ID", transactionId);

  const shareParts = [
    "Estate bill payment receipt",
    billName ? `Bill: ${billName}` : null,
    amountPaid ? `Amount: ${amountPaid}` : null,
  ].filter(Boolean);

  return {
    type: "bill",
    title: "ESTATE BILL PAYMENT RECEIPT",
    subtitle: billName
      ? `Receipt for ${billName}`
      : "Receipt for estate bill payment",
    statusLabel,
    statusTone,
    receiptDate: paymentDate,
    dueDate: formatReceiptDate(bill.nextDueDate) ?? formatReceiptDateTime(bill.nextDueDate),
    infoTitle: "RESIDENT INFORMATION",
    infoFields,
    detailTitle: "PAYMENT DETAILS",
    detailRows,
    amountPaid,
    shareText: shareParts.join("\n"),
    fileBaseName: sanitizeFileBase(billName ?? "bill"),
  };
}

export function mapVendReceipt(
  vend: EnergyListItem,
  party: ReceiptParty = {},
): ReceiptViewModel {
  const paymentDate = formatReceiptDateTime(vend.createdAt) ?? formatReceiptDate(vend.createdAt);
  const amountPaid = formatReceiptNaira(vend.amount);
  const pricePerUnit = formatReceiptNaira(vend.price);
  const unitsLabel = [vend.value, vend.unit].filter(Boolean).join(" ").trim();
  const token = formatTokenGroups(vend.token);
  const receiptNo = vend.receiptNo?.trim() || undefined;

  const infoFields: ReceiptInfoField[] = [];
  pushField(infoFields, "Meter Number", vend.device);
  pushField(infoFields, "Estate", party.estateName);
  pushField(infoFields, "Resident Name", party.payerName);
  pushField(infoFields, "Email Address", party.email);
  pushField(infoFields, "Unit / House No.", party.addressLabel);

  const detailRows: ReceiptInfoField[] = [];
  pushField(detailRows, "Amount Paid", amountPaid);
  pushField(detailRows, "Units Bought", unitsLabel || undefined);
  pushField(detailRows, "Price per Unit", pricePerUnit);
  pushField(detailRows, "Payment Date", paymentDate);

  const shareParts = [
    "Estate energy vend receipt",
    receiptNo ? `Receipt: ${receiptNo}` : null,
    amountPaid ? `Amount: ${amountPaid}` : null,
    unitsLabel ? `Units: ${unitsLabel}` : null,
    token ? `Token: ${token}` : null,
  ].filter(Boolean);

  return {
    type: "vend",
    title: "ESTATE ENERGY VEND RECEIPT",
    subtitle: "Payment for estate vend.",
    statusLabel: "VEND SUCCESSFUL",
    statusTone: "success",
    receiptNo,
    receiptDate: paymentDate,
    infoTitle: "METER INFORMATION",
    infoFields,
    detailTitle: "VEND DETAILS",
    detailRows,
    amountPaid,
    token,
    summary:
      unitsLabel || amountPaid || pricePerUnit
        ? {
            unitsBought: unitsLabel || "—",
            amountPaid: amountPaid || "—",
            pricePerUnit: pricePerUnit || "—",
            total: amountPaid || "—",
          }
        : undefined,
    shareText: shareParts.join("\n"),
    fileBaseName: sanitizeFileBase(receiptNo ?? "vend"),
  };
}
