"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm from "@/components/resident/bill-form/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import { getBillsForAddress } from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses, type AddressOption } from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";

/** Shape returned by GET /api/v1/bills-mgt/for-address */
interface AddressBillData {
  id?: string;
  billId?: string;
  userId?: string;
  billName?: string;
  name?: string;
  frequency?: string;
  amountPaid?: number;
  amount?: number;
  yearlyAmount?: number;
  startDate?: string;
  nextDueDate?: string;
  status?: string;
  lastPaymentDate?: string | null;
  createdAt?: string;
}

function formatFrequencyLabel(frequency?: string): string {
  if (!frequency) return "";
  const map: Record<string, string> = {
    oneOff: "One-off",
    quarterly: "Quarterly",
    yearly: "Yearly",
    monthly: "Monthly",
  };
  return map[frequency] || frequency;
}

function billDisplayName(bill: AddressBillData): string {
  return bill.billName || bill.name || "Untitled bill";
}

function billAmount(bill: AddressBillData): number {
  return Number(bill.amountPaid ?? bill.amount ?? bill.yearlyAmount ?? 0);
}

function billPayId(bill: AddressBillData): string | null {
  return bill.billId || bill.id || null;
}

function extractBillsList(res: unknown): AddressBillData[] {
  if (!res || typeof res !== "object") return [];
  const payload = res as { data?: unknown };
  if (Array.isArray(payload.data)) return payload.data as AddressBillData[];
  if (Array.isArray(res)) return res as AddressBillData[];
  return [];
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<AddressBillData | null>(null);

  const [addressBills, setAddressBills] = useState<AddressBillData[]>([]);
  const [billsPagination, setBillsPagination] = useState<{
    total?: number;
    page?: number;
    limit?: number;
  }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingBills, setLoadingBills] = useState(false);

  const [estateId, setEstateId] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const fetchAddressBills = useCallback(
    async (addressId: string, eId: string, limit = 50) => {
      setLoadingBills(true);
      try {
        const res = await dispatch(
          getBillsForAddress({
            addressId,
            estateId: eId,
            page: 1,
            limit,
          }),
        ).unwrap();
        setAddressBills(extractBillsList(res));
        setBillsPagination(
          (res as { pagination?: { total?: number; page?: number; limit?: number } })
            ?.pagination || {},
        );
      } finally {
        setLoadingBills(false);
      }
    },
    [dispatch],
  );

  // fetch user + addresses
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        if (!user) {
          toast.warning("No signed in user found");
          setLoading(false);
          return;
        }

        const rawEstateId = user.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const eId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id ||
              rawEstateId?.id ||
              ((user.estate as { id?: string; _id?: string } | undefined)?._id ??
                (user.estate as { id?: string } | undefined)?.id ??
                "");
        const addresses = normalizeAddresses(user);
        const firstId = addresses.length > 0 ? addresses[0].id : null;

        setEstateId(eId);
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);

        if (!eId) {
          toast.warning("The signed-in user does not have an estate assigned.");
        }
        if (!firstId) {
          toast.warning("No address is linked to this account.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  // Load address-scoped bills whenever address/estate is ready or changes
  useEffect(() => {
    if (!selectedAddressId || !estateId) {
      setAddressBills([]);
      setBillsPagination({});
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await fetchAddressBills(selectedAddressId, estateId);
      } catch (err: any) {
        if (!cancelled) {
          setAddressBills([]);
          toast.error(err?.message || "Failed to fetch bills for address");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAddressId, estateId, fetchAddressBills]);

  const handleOpenModal = (bill: AddressBillData) => {
    const payId = billPayId(bill);
    if (!payId) return;
    setSelectedBill(bill);
    setSelectedBillId(payId);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
    setSelectedBillId(null);
    setOpen(false);
  };

  const refreshLists = async () => {
    if (!selectedAddressId || !estateId) return;
    try {
      await fetchAddressBills(selectedAddressId, estateId);
    } catch (err: any) {
      console.error("Refresh lists failed:", err);
    }
  };

  const columns = [
    {
      key: "billName",
      header: "Bill Name",
      render: (item: AddressBillData) => billDisplayName(item),
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: AddressBillData) =>
        formatFrequencyLabel(item.frequency) || item.frequency || "-",
    },
    {
      key: "amountPaid",
      header: "Amount",
      render: (item: AddressBillData) =>
        `₦${billAmount(item).toLocaleString()}`,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: AddressBillData) =>
        item.startDate ? new Date(item.startDate).toLocaleString() : "-",
    },
    {
      key: "nextDueDate",
      header: "Next Due Date",
      render: (item: AddressBillData) =>
        item.nextDueDate ? new Date(item.nextDueDate).toLocaleString() : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (item: AddressBillData) => item.status || "-",
    },
  ];

  const showEmpty =
    !loading && !loadingBills && addressBills.length === 0;

  return (
    <div className="relative">
      {(loading || loadingBills) && (
        <Loader fullScreen label="Loading bills..." />
      )}

      <div
        className={[
          "space-y-6",
          loading || loadingBills ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex items-center">
          <h1 className="font-heading text-3xl font-bold">Estate Bills</h1>
          <button
            type="button"
            onClick={() =>
              toast.info("To pay a bill, click any payable bill card.")
            }
            aria-label="How to pay"
            title="How to pay"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>

        <SwitchAddress
          addresses={addressOptions}
          value={selectedAddressId}
          onChange={setSelectedAddressId}
        />

        {/* Address-scoped bills - cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showEmpty ? (
            <p className="text-muted-foreground">
              {selectedAddressId
                ? "No bills assigned to this address."
                : "Select an address to view bills."}
            </p>
          ) : (
            addressBills.map((b) => {
              const freqLabel = formatFrequencyLabel(b.frequency);
              const amount = billAmount(b);
              const key = b.id || billPayId(b) || billDisplayName(b);
              return (
                <Card
                  key={key}
                  className="p-4 cursor-pointer hover:shadow-md"
                  onClick={() => handleOpenModal(b)}
                >
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold capitalize text-blue-600">
                      {billDisplayName(b)}
                    </h3>
                    <p className="text-md font-bold mt-1">
                      ₦{amount.toLocaleString()}
                      {freqLabel ? (
                        <span className="text-sm font-medium text-muted-foreground">
                          {" "}
                          / {freqLabel.toLowerCase()}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Address bills table */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Bills for this address</h2>
          <Table
            columns={columns}
            data={addressBills}
            emptyMessage="No bills assigned to this address."
            showPagination
            paginationInfo={{
              total: billsPagination?.total || addressBills.length || 0,
              current: Number(billsPagination?.page) || 1,
              pageSize: Number(billsPagination?.limit) || 10,
            }}
            enableExport
            exportFileName="address-bills"
            onExportRequest={
              selectedAddressId && estateId
                ? async () => {
                    const res = await dispatch(
                      getBillsForAddress({
                        addressId: selectedAddressId,
                        estateId,
                        page: 1,
                        limit: 50000,
                      }),
                    ).unwrap();
                    return extractBillsList(res);
                  }
                : undefined
            }
          />
        </Card>

        {open && selectedBillId && (
          <Modal visible={open} onClose={handleCloseModal}>
            <BillsForm
              billId={selectedBillId}
              initialBill={
                selectedBill
                  ? {
                      name: billDisplayName(selectedBill),
                      amount: billAmount(selectedBill),
                      frequency: selectedBill.frequency,
                    }
                  : undefined
              }
              addressOptions={addressOptions}
              selectedAddressId={selectedAddressId}
              onSelectedAddressChange={setSelectedAddressId}
              onSubmitSuccess={refreshLists}
              onClose={handleCloseModal}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
