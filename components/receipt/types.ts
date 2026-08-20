import type { PaidBillData } from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";

export type ReceiptType = "bill" | "vend";

/** Context composed from the signed-in user / selected address — not receipt-API fields. */
export type ReceiptParty = {
  payerName?: string;
  email?: string;
  estateName?: string;
  addressLabel?: string;
};

export type ReceiptInfoField = {
  label: string;
  value: string;
};

export type ReceiptViewModel = {
  type: ReceiptType;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "success" | "pending" | "failed";
  receiptNo?: string;
  receiptDate?: string;
  dueDate?: string;
  infoTitle: string;
  infoFields: ReceiptInfoField[];
  detailTitle: string;
  detailRows: ReceiptInfoField[];
  amountPaid?: string;
  token?: string;
  summary?: {
    unitsBought: string;
    amountPaid: string;
    pricePerUnit: string;
    total: string;
  };
  shareText: string;
  fileBaseName: string;
};

export type PaidBillReceiptSource = PaidBillData & {
  tx_ref?: string;
  transactionId?: string;
  receiptNo?: string;
  reference?: string;
};

export type { PaidBillData } from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";
export type { EnergyListItem } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
