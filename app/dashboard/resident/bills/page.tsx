"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Info } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm from "@/components/resident/bill-form/page";
import SwitchAddress from "@/components/resident/switch-address/page";
import {
  getBillsByEstate,
  getBillsForAddress,
  getResidentBills,
  payBill,
} from "@/redux/slice/resident/bill-mgt/bills-mgt";
import {
  clearAssignedBills,
  type AssignedBillData,
  type EstateBillData,
  type PaidBillData,
} from "@/redux/slice/resident/bill-mgt/bills-mgt-slice";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  formatAddressLabel,
  normalizeAddresses,
  type AddressOption,
} from "@/lib/address";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import { isPending, isSettled } from "@/lib/async-status";
import { getApiErrorMessage } from "@/lib/api-error";

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

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (
    value == null ||
    value === "" ||
    value === "-" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-border/60 py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value}</span>
    </div>
  );
}

function assignedBillName(bill: AssignedBillData): string {
  return bill.billName || bill.name || "Untitled bill";
}

function assignedBillAmount(bill: AssignedBillData): number {
  return Number(bill.amountDue ?? bill.amount ?? bill.yearlyAmount ?? 0);
}

function assignedBillPayId(bill: AssignedBillData): string | null {
  return bill.billId || bill.id || bill._id || null;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<BillsTab>("estate");
  const [paidStartDate, setPaidStartDate] = useState("");
  const [paidEndDate, setPaidEndDate] = useState("");
  const [userId, setUserId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [estateId, setEstateId] = useState("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [bootstrapping, setBootstrapping] = useState(true);
  const [viewBill, setViewBill] = useState<PaidBillData | null>(null);
  const [payBillId, setPayBillId] = useState<string | null>(null);

  const {
    estateBills,
    assignedBills,
    paidBills,
    paidPagination,
    getBillsByEstateState,
    getBillsForAddressState,
    getResidentBillsState,
    paying,
  } = useSelector((state: RootState) => {
    const s = state.residentBill as any;
    return {
      estateBills: (s?.estateBills?.data || []) as EstateBillData[],
      assignedBills: (s?.assignedBills?.data || []) as AssignedBillData[],
      paidBills: (s?.paidBills?.data || []) as PaidBillData[],
      paidPagination: s?.paidBills?.pagination || {},
      getBillsByEstateState: s?.getBillsByEstateState as string,
      getBillsForAddressState: s?.getBillsForAddressState as string,
      getResidentBillsState: s?.getResidentBillsState as string,
      paying: s?.payBillState === "isLoading",
    };
  });

  const loadingEstate = isPending(getBillsByEstateState);
  const loadingAssigned = isPending(getBillsForAddressState);
  const loadingPaid = isPending(getResidentBillsState);

  // Bootstrap user / addresses / estate bills
  useEffect(() => {
    (async () => {
      setBootstrapping(true);
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data as Record<string, unknown> | undefined;
        if (!user) {
          toast.warning("No signed in user found");
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
          await dispatch(
            getBillsByEstate({ estateId: eId, page: 1, limit: 50 }),
          ).unwrap();
        }
      } catch (err: unknown) {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [dispatch]);

  // Paid bills — date filter pattern matches rent/other pages
  useEffect(() => {
    if (!userId) return;

    const shouldApplyDate = Boolean(paidStartDate && paidEndDate);
    dispatch(
      getResidentBills({
        residentId: userId,
        page: 1,
        limit: 10,
        startDate: shouldApplyDate ? paidStartDate : undefined,
        endDate: shouldApplyDate ? paidEndDate : undefined,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, userId, paidStartDate, paidEndDate]);

  // Assigned bills for selected address
  useEffect(() => {
    if (!selectedAddressId || !estateId) {
      dispatch(clearAssignedBills());
      return;
    }

    dispatch(
      getBillsForAddress({
        addressId: selectedAddressId,
        estateId,
        page: 1,
        limit: 50,
      }),
    )
      .unwrap()
      .catch((err: unknown) => {
        const message = getApiErrorMessage(err);
        if (message) toast.error(message);
      });
  }, [dispatch, selectedAddressId, estateId]);

  const refreshAfterPay = async () => {
    if (!userId) return;
    const shouldApplyDate = Boolean(paidStartDate && paidEndDate);

    if (estateId) {
      dispatch(getBillsByEstate({ estateId, page: 1, limit: 50 })).catch(
        () => {},
      );
    }
    if (selectedAddressId && estateId) {
      dispatch(
        getBillsForAddress({
          addressId: selectedAddressId,
          estateId,
          page: 1,
          limit: 50,
        }),
      ).catch(() => {});
    }
    dispatch(
      getResidentBills({
        residentId: userId,
        page: Number(paidPagination?.page) || 1,
        limit: Number(paidPagination?.limit) || 10,
        startDate: shouldApplyDate ? paidStartDate : undefined,
        endDate: shouldApplyDate ? paidEndDate : undefined,
      }),
    ).catch(() => {});
  };

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

    if (!estateId) {
      toast.error("Missing estate information. Please refresh and try again.");
      return;
    }

    if (addressOptions.length > 1 && !selectedAddressId) {
      toast.error("Please select an address before paying.");
      return;
    }

    if (paying) return;

    try {
      await dispatch(
        payBill({
          billId: payload.billId,
          userId,
          walletId,
          estateId,
          addressId: selectedAddressId ?? undefined,
          frequency: payload.frequency,
          amountPaid: payload.amountPaid,
        }),
      ).unwrap();
      toast.success("Bill payment successful");
      await refreshAfterPay();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      if (message) toast.error(message);
    }
  };

  const resolveAddressLabel = (addressId?: string) => {
    if (!addressId) return "-";
    const match = addressOptions.find((a) => a.id === addressId);
    return match ? formatAddressLabel(match) : addressId;
  };

  const columns = [
    {
      key: "billName",
      header: "Bill Name",
      render: (item: PaidBillData) => item.billName || "-",
    },
    {
      key: "frequency",
      header: "Frequency",
      render: (item: PaidBillData) =>
        formatFrequencyLabel(item.frequency) || item.frequency || "-",
    },
    {
      key: "amountPaid",
      header: "Amount Paid",
      render: (item: PaidBillData) =>
        `₦${Number(item.amountPaid ?? 0).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (item: PaidBillData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            item.status === "paid"
              ? "bg-green-100 text-green-700"
              : item.status === "active"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {item.status || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      exportable: false as const,
      render: (item: PaidBillData) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewBill(item)}
          title="View more"
          aria-label="View more"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const showLoader =
    bootstrapping ||
    (activeTab === "estate" && Boolean(estateId) && loadingEstate) ||
    (activeTab === "assigned" &&
      Boolean(selectedAddressId) &&
      loadingAssigned) ||
    paying;

  return (
    <div className="relative">
      {showLoader && (
        <Loader
          fullScreen
          label={paying ? "Processing payment..." : "Loading bills..."}
        />
      )}

      <div
        className={[
          "space-y-6",
          showLoader ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-1">
          <h1 className="font-heading text-3xl font-bold">Estate Bills</h1>
          <button
            type="button"
            onClick={() =>
              toast.info(
                "Estate bills open a payment form. Assigned bills pay when you click the card.",
              )
            }
            aria-label="How to pay"
            title="How to pay"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
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
            {!bootstrapping &&
            isSettled(getBillsByEstateState) &&
            estateBills.length === 0 ? (
              <p className="text-muted-foreground">
                No payable bills for this estate.
              </p>
            ) : (
              estateBills.map((b) => (
                <Card
                  key={b.id}
                  className="p-4 cursor-pointer hover:shadow-md"
                  onClick={() => b.id && setPayBillId(b.id)}
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
            ) : !bootstrapping &&
              isSettled(getBillsForAddressState) &&
              assignedBills.length === 0 ? (
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
                    key={b.id || b._id || payId || assignedBillName(b)}
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

        <Card className="p-4">
          <h2 className="font-semibold mb-4">Your Paid Bills</h2>
          <Table
            columns={columns}
            data={paidBills}
            emptyMessage={
              isSettled(getResidentBillsState)
                ? "You haven't paid any bills yet."
                : " "
            }
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={paidStartDate}
            endDate={paidEndDate}
            onDateRangeChange={({ startDate, endDate }) => {
              setPaidStartDate(startDate);
              setPaidEndDate(endDate);
            }}
            showPagination
            paginationInfo={{
              total: paidPagination?.total || paidBills.length || 0,
              current:
                Number(paidPagination?.page) ||
                Number(paidPagination?.currentPage) ||
                1,
              pageSize:
                Number(paidPagination?.limit) ||
                Number(paidPagination?.pageSize) ||
                10,
            }}
            onPageChange={(page) => {
              if (!userId) return;
              const shouldApplyDate = Boolean(paidStartDate && paidEndDate);
              dispatch(
                getResidentBills({
                  residentId: userId,
                  page,
                  limit: Number(paidPagination?.limit) || 10,
                  startDate: shouldApplyDate ? paidStartDate : undefined,
                  endDate: shouldApplyDate ? paidEndDate : undefined,
                }),
              )
                .unwrap()
                .catch((err: unknown) => {
                  const message = getApiErrorMessage(err);
                  if (message) toast.error(message);
                });
            }}
            enableExport
            exportFileName="paid-bills"
            onExportRequest={
              userId
                ? async () => {
                    const shouldApplyDate = Boolean(
                      paidStartDate && paidEndDate,
                    );
                    const res = await dispatch(
                      getResidentBills({
                        residentId: userId,
                        page: 1,
                        limit: 50000,
                        startDate: shouldApplyDate
                          ? paidStartDate
                          : undefined,
                        endDate: shouldApplyDate ? paidEndDate : undefined,
                      }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
          {loadingPaid ? (
            <p className="text-xs text-muted-foreground mt-2">
              Loading paid bills...
            </p>
          ) : null}
        </Card>

        <Modal visible={!!payBillId} onClose={() => setPayBillId(null)}>
          {payBillId ? (
            <BillsForm
              billId={payBillId}
              estateId={estateId}
              addressOptions={addressOptions}
              selectedAddressId={selectedAddressId}
              onSelectedAddressChange={setSelectedAddressId}
              onSubmitSuccess={refreshAfterPay}
              onClose={() => setPayBillId(null)}
            />
          ) : null}
        </Modal>

        <Modal visible={!!viewBill} onClose={() => setViewBill(null)}>
          <div className="pr-6 pt-2">
            <h2 className="text-lg font-semibold text-blue-600 capitalize mb-4">
              {viewBill?.billName || "Bill details"}
            </h2>
            <div className="space-y-0">
              <DetailRow
                label="Bill name"
                value={viewBill?.billName || null}
              />
              <DetailRow
                label="Frequency"
                value={
                  formatFrequencyLabel(viewBill?.frequency) ||
                  viewBill?.frequency ||
                  null
                }
              />
              <DetailRow
                label="Amount paid"
                value={
                  viewBill?.amountPaid != null
                    ? `₦${Number(viewBill.amountPaid).toLocaleString()}`
                    : null
                }
              />
              <DetailRow
                label="Status"
                value={
                  viewBill?.status ? (
                    <span className="capitalize">{viewBill.status}</span>
                  ) : null
                }
              />
              <DetailRow
                label="Last payment date"
                value={formatDateTime(viewBill?.lastPaymentDate)}
              />
              <DetailRow
                label="Start date"
                value={formatDateTime(viewBill?.startDate)}
              />
              <DetailRow
                label="Next due date"
                value={formatDateTime(viewBill?.nextDueDate)}
              />
              <DetailRow
                label="Address"
                value={
                  viewBill?.addressId
                    ? resolveAddressLabel(viewBill.addressId)
                    : null
                }
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
