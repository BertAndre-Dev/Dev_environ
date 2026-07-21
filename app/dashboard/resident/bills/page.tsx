"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import Table from "@/components/tables/list/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import {
  getBillsByEstate,
  getBillsForAddress,
  getResidentBills,
  payBill,
} from "@/redux/slice/resident/bill-mgt/bills-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses, type AddressOption } from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import Loader from "@/components/ui/Loader";

interface EstateBillData {
  id?: string;
  estateId?: string;
  name?: string;
  description?: string;
  yearlyAmount?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface AssignedBillData {
  id?: string;
  billId?: string;
  billName?: string;
  name?: string;
  frequency?: string;
  amountPaid?: number;
  amount?: number;
  yearlyAmount?: number;
  status?: string;
  createdAt?: string;
}

type BillsTab = "estate" | "assigned";

const TABS: { id: BillsTab; label: string }[] = [
  { id: "estate", label: "Estate Bills" },
  { id: "assigned", label: "Assigned Bills" },
];

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

function assignedBillName(bill: AssignedBillData): string {
  return bill.billName || bill.name || "Untitled bill";
}

function assignedBillAmount(bill: AssignedBillData): number {
  return Number(bill.amountPaid ?? bill.amount ?? bill.yearlyAmount ?? 0);
}

function assignedBillPayId(bill: AssignedBillData): string | null {
  return bill.billId || bill.id || null;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<BillsTab>("estate");

  const [payableBills, setPayableBills] = useState<EstateBillData[]>([]);
  const [assignedBills, setAssignedBills] = useState<AssignedBillData[]>([]);
  const [paidBills, setPaidBills] = useState<any[]>([]);
  const [paidPagination, setPaidPagination] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [estateId, setEstateId] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const fetchAssignedBills = useCallback(
    async (addressId: string, eId: string, limit = 50) => {
      setLoadingAssigned(true);
      try {
        const res = await dispatch(
          getBillsForAddress({
            addressId,
            estateId: eId,
            page: 1,
            limit,
          }),
        ).unwrap();
        setAssignedBills(Array.isArray(res?.data) ? res.data : []);
      } finally {
        setLoadingAssigned(false);
      }
    },
    [dispatch],
  );

  const refreshLists = useCallback(async () => {
    if (!userId) return;
    try {
      if (estateId) {
        const estateRes = await dispatch(
          getBillsByEstate({ estateId, page: 1, limit: 50 }),
        ).unwrap();
        setPayableBills(estateRes?.data || []);
      }

      if (selectedAddressId && estateId) {
        await fetchAssignedBills(selectedAddressId, estateId);
      }

      const residentRes = await dispatch(
        getResidentBills({ residentId: userId, page: 1, limit: 50 }),
      ).unwrap();
      setPaidBills(residentRes?.data || []);
      setPaidPagination(residentRes?.pagination || {});
    } catch (err: any) {
      console.error("Refresh lists failed:", err);
    }
  }, [
    dispatch,
    estateId,
    fetchAssignedBills,
    selectedAddressId,
    userId,
  ]);

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
        const uId = (user.id ?? user._id ?? "") as string;
        const wId =
          (user.walletId as string | undefined) ??
          ((user.wallet as { id?: string } | undefined)?.id ?? "");

        const rawEstateId = user.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const eId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id ||
              rawEstateId?.id ||
              ((user.estate as { id?: string } | undefined)?.id ?? "");
        const addresses = normalizeAddresses(user);
        const firstId = addresses.length > 0 ? addresses[0].id : null;

        setUserId(uId);
        setWalletId(wId);
        setEstateId(eId);
        setAddressOptions(addresses);
        setSelectedAddressId((prev) => prev ?? firstId);

        if (!eId) {
          toast.warning("The signed-in user does not have an estate assigned.");
        } else {
          const estateRes = await dispatch(
            getBillsByEstate({ estateId: eId, page: 1, limit: 50 }),
          ).unwrap();
          setPayableBills(estateRes?.data || []);
        }

        const residentRes = await dispatch(
          getResidentBills({ residentId: uId, page: 1, limit: 10 }),
        ).unwrap();
        setPaidBills(residentRes?.data || []);
        setPaidPagination(residentRes?.pagination || {});
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch bills or user info");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedAddressId || !estateId) {
      setAssignedBills([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await fetchAssignedBills(selectedAddressId, estateId);
      } catch (err: any) {
        if (!cancelled) {
          setAssignedBills([]);
          toast.error(err?.message || "Failed to fetch assigned bills");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAddressId, estateId, fetchAssignedBills]);

  const handlePayBill = async (payload: {
    billId: string;
    frequency: string;
    amountPaid: number;
  }) => {
    if (!payload.billId) return;

    if (!userId || !walletId) {
      toast.error("Missing wallet information. Please refresh and try again.");
      return;
    }

    if (addressOptions.length > 1 && !selectedAddressId) {
      toast.error("Please select an address before paying.");
      return;
    }

    if (payingBillId) return;

    setPayingBillId(payload.billId);
    try {
      await dispatch(
        payBill({
          billId: payload.billId,
          userId,
          walletId,
          addressId: selectedAddressId ?? undefined,
          frequency: payload.frequency,
          amountPaid: payload.amountPaid,
        }),
      ).unwrap();
      toast.success("Bill payment successful");
      await refreshLists();
    } catch (err: any) {
      toast.error(
        err?.message ||
          err?.payload?.message ||
          "Failed to pay bill",
      );
    } finally {
      setPayingBillId(null);
    }
  };

  const columns = [
    { key: "billName", header: "Bill Name" },
    { key: "frequency", header: "Frequency" },
    {
      key: "amountPaid",
      header: "Amount Paid",
      render: (item: any) =>
        `₦${Number(item.amountPaid ?? 0).toLocaleString()}`,
    },
    {
      key: "startDate",
      header: "Start Date",
      render: (item: any) =>
        item.startDate ? new Date(item.startDate).toLocaleString() : "-",
    },
    {
      key: "nextDueDate",
      header: "Next Due Date",
      render: (item: any) =>
        item.nextDueDate ? new Date(item.nextDueDate).toLocaleString() : "-",
    },
  ];

  const showLoader =
    loading ||
    (activeTab === "assigned" && loadingAssigned) ||
    Boolean(payingBillId);

  return (
    <div className="relative">
      {showLoader && (
        <Loader
          fullScreen
          label={payingBillId ? "Processing payment..." : "Loading bills..."}
        />
      )}

      <div
        className={[
          "space-y-6",
          showLoader ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-1">
          <h1 className="font-heading text-3xl font-bold">Bills</h1>
          <button
            type="button"
            onClick={() =>
              toast.info("To pay a bill, click any bill card.")
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

        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "estate" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!loading && payableBills.length === 0 ? (
              <p className="text-muted-foreground">
                No payable bills for this estate.
              </p>
            ) : (
              payableBills.map((b) => (
                <Card
                  key={b.id}
                  className="p-4 cursor-pointer hover:shadow-md"
                  onClick={() =>
                    b.id &&
                    handlePayBill({
                      billId: b.id,
                      frequency: "yearly",
                      amountPaid: Number(b.yearlyAmount ?? 0),
                    })
                  }
                >
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold capitalize text-blue-600">
                      {b.name}
                    </h3>
                    <p className="text-md font-bold mt-1 capitalize">
                      ₦{Number(b.yearlyAmount ?? 0).toLocaleString()}/annum
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!selectedAddressId ? (
              <p className="text-muted-foreground">
                Select an address to view assigned bills.
              </p>
            ) : !loadingAssigned && assignedBills.length === 0 ? (
              <p className="text-muted-foreground">
                No bills assigned to this address.
              </p>
            ) : (
              assignedBills.map((b) => {
                const payId = assignedBillPayId(b);
                const freqLabel = formatFrequencyLabel(b.frequency);
                const amount = assignedBillAmount(b);
                return (
                  <Card
                    key={b.id || payId || assignedBillName(b)}
                    className="p-4 cursor-pointer hover:shadow-md"
                    onClick={() =>
                      payId &&
                      handlePayBill({
                        billId: payId,
                        frequency: b.frequency || "oneOff",
                        amountPaid: amount,
                      })
                    }
                  >
                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold capitalize text-blue-600">
                        {assignedBillName(b)}
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
        )}

        {/* Paid bills table — shared across tabs */}
        <Card className="p-4">
          <h2 className="font-semibold mb-4">Your Paid Bills</h2>
          <Table
            columns={columns}
            data={paidBills || []}
            emptyMessage="You haven't paid any bills yet."
            showPagination
            paginationInfo={{
              total: paidPagination?.total || paidBills.length || 0,
              current: Number(paidPagination?.page) || 1,
              pageSize: Number(paidPagination?.limit) || 10,
            }}
            enableExport
            exportFileName="paid-bills"
            onExportRequest={
              userId
                ? async () => {
                    const res = await dispatch(
                      getResidentBills({
                        residentId: userId,
                        page: 1,
                        limit: 50000,
                      }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
        </Card>
      </div>
    </div>
  );
}
