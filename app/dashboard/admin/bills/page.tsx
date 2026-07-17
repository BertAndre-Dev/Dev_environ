"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, ScrollText, Power, PowerOff } from "lucide-react";
import Table from "@/components/tables/list/page";
import Modal from "@/components/modal/page";
import BillsForm, {
  type BillSubmitData,
} from "@/components/admin/bills-form/page";
import BillForAddressForm, {
  type BillForAddressFormData,
} from "@/components/admin/bill-for-address-form/page";

import {
  activateBill,
  createBill,
  createBillForAddress,
  deleteBill,
  getBillsByEstate,
  suspendBill,
  updateBill,
} from "@/redux/slice/admin/bills-mgt/bills";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import SuspendRentModal from "@/components/resident/suspend-rent-modal/page";
import Loader from "@/components/ui/Loader";
import { formatAmountDisplay } from "@/lib/format-number";

interface BillData {
  createdAt?: string;
  id?: string;
  estateId: string;
  name: string;
  description: string;
  yearlyAmount: number;
  isActive?: boolean;
}

export default function BillPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateName, setEstateName] = useState("Estate");
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const [billsStartDate, setBillsStartDate] = useState("");
  const [billsEndDate, setBillsEndDate] = useState("");
  const [suspendBillItem, setSuspendBillItem] = useState<BillData | null>(null);
  const [suspendSubmitting, setSuspendSubmitting] = useState(false);

  const { allBills, pagination, loading } = useSelector(
    (state: RootState) => {
      const billState = state.adminBill as any;
      return {
        allBills: billState?.allBills?.data || [],
        pagination: billState?.allBills?.pagination || {},
        loading:
          billState.getBillsByEstateState === "isLoading" ||
          billState.createBillState === "isLoading" ||
          billState.updateBillState === "isLoading" ||
          billState.deleteBillState === "isLoading",
      };
    },
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const rawEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : rawEstateId?._id || rawEstateId?.id || "";

        const estateFromId =
          (data?.estateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!foundEstateId) {
          toast.warning("No estate found for this user.");
          return;
        }

        setEstateId(foundEstateId);

        await dispatch(
          getBillsByEstate({ estateId: foundEstateId, page: 1, limit: 10 }),
        ).unwrap();
      } catch {
        toast.error("Failed to fetch bills.");
      }
    })();
  }, [dispatch]);

  // Refetch bills when date range changes (only apply when both are selected)
  useEffect(() => {
    if (!estateId) return;
    const shouldApplyDate = Boolean(billsStartDate && billsEndDate);
    dispatch(
      getBillsByEstate({
        estateId,
        page: 1,
        limit: 10,
        startDate: shouldApplyDate ? billsStartDate : undefined,
        endDate: shouldApplyDate ? billsEndDate : undefined,
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch bills."));
  }, [dispatch, estateId, billsStartDate, billsEndDate]);

  const handleOpenModal = (bill?: BillData) => {
    setSelectedBill(bill || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
    setOpen(false);
  };

  const openAssignModal = () => {
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
  };

  const openSuspendModal = (bill: BillData) => {
    if (!bill.id || !bill.isActive) return;
    setSuspendBillItem(bill);
  };

  const handleSuspendConfirm = async (_reason: string) => {
    if (!suspendBillItem?.id || !estateId) return;
    setSuspendSubmitting(true);
    try {
      await dispatch(suspendBill(suspendBillItem.id)).unwrap();
      toast.info(`${suspendBillItem.name} suspended.`);
      setSuspendBillItem(null);
      await dispatch(
        getBillsByEstate({
          estateId,
          page: 1,
          limit: 10,
          startDate:
            billsStartDate && billsEndDate ? billsStartDate : undefined,
          endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
        }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message);
    } finally {
      setSuspendSubmitting(false);
    }
  };

  const handleActivateBill = async (bill: BillData) => {
    if (!bill.id || !estateId) return;
    try {
      await dispatch(activateBill(bill.id)).unwrap();
      toast.success(`${bill.name} activated.`);
      await dispatch(
        getBillsByEstate({
          estateId,
          page: 1,
          limit: 10,
          startDate:
            billsStartDate && billsEndDate ? billsStartDate : undefined,
          endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
        }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message);
    }
  };

  const handleDeleteBill = async (id?: string, name?: string) => {
    if (!id || !estateId) return;

    confirmDeleteToast({
      name,
      onConfirm: async () => {
        await dispatch(deleteBill(id)).unwrap();
        toast.success(`${name} deleted successfully.`);
        await dispatch(
          getBillsByEstate({
            estateId,
            page: 1,
            limit: 10,
            startDate:
              billsStartDate && billsEndDate ? billsStartDate : undefined,
            endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
          }),
        ).unwrap();
      },
    });
  };

  const handleSubmitBill = async (data: BillSubmitData) => {
    if (!estateId) return;

    try {
      if (selectedBill?.id) {
        await dispatch(updateBill({ billId: selectedBill.id, data })).unwrap();
        toast.success("Bill updated successfully!");
      } else {
        await dispatch(createBill(data)).unwrap();
        toast.success("Bill created successfully!");
      }

      handleCloseModal();
      await dispatch(
        getBillsByEstate({
          estateId,
          page: 1,
          limit: 10,
          startDate:
            billsStartDate && billsEndDate ? billsStartDate : undefined,
          endDate: billsStartDate && billsEndDate ? billsEndDate : undefined,
        }),
      ).unwrap();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save bill.");
    }
  };

  const handleAssignBillForAddress = async (data: BillForAddressFormData) => {
    if (!estateId) return;

    try {
      await dispatch(
        createBillForAddress({
          addressId: data.addressId,
          estateId,
          name: data.name,
          description: data.description,
          amount: data.amount,
          frequency: data.frequency,
          isServiceCharge: data.isServiceCharge,
        }),
      ).unwrap();
      toast.success("One-off bill created for address successfully.");
      closeAssignModal();
    } catch (err: any) {
      toast.error(
        err?.message ??
          err?.payload?.message ??
          "Failed to create bill for address.",
      );
    }
  };

  const columns: {
    key: string;
    header: string;
    render?: (item: BillData) => React.ReactNode;
  }[] = [
    {
      key: "createdAt",
      header: "Created At",
      render: (item: BillData) =>
        new Date(item.createdAt as string | number | Date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
    },
    { key: "name", header: "Bill Name" },
    { key: "description", header: "Description" },
    {
      key: "yearlyAmount",
      header: "Yearly Amount (₦)",
      render: (item: BillData) => formatAmountDisplay(item.yearlyAmount),
    },
    {
      key: "isActive",
      header: "Status",
      render: (item: BillData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: BillData) => (
        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
          >
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          {item.isActive ? (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => openSuspendModal(item)}
              title="Suspend bill"
            >
              <PowerOff className="w-4 h-4 text-red-600" />
            </Button>
          ) : (
            <Button
              className="cursor-pointer"
              variant="ghost"
              size="sm"
              onClick={() => handleActivateBill(item)}
              title="Activate bill"
            >
              <Power className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBill(item.id, item.name)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredBills = (allBills || []).filter((bill: BillData) => {
    const q = billSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      bill.name.toLowerCase().includes(q) ||
      bill.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading bills..." />}

      <div
        className={[
          "space-y-6",
          loading ? "pointer-events-none select-none" : "",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Bills Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, track, and manage estate bills and payments in{" "}
              <span className="text-[18px] font-bold underline uppercase text-black">
                {estateName}
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Bill
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={openAssignModal}
            >
              <ScrollText className="w-4 h-4" />
              Assign Bill
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-sm">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="font-heading text-2xl font-bold mt-2">
                  {pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#D0DFF280]">
                <ScrollText className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Input
              type="text"
              placeholder="Search bills by name or description..."
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              className="w-full sm:w-80"
            />
          </div>

          <Table
            columns={columns}
            data={filteredBills}
            emptyMessage="No bills found."
            enableDateRangeFilter
            defaultDateRangeDays={0}
            startDate={billsStartDate}
            endDate={billsEndDate}
            onDateRangeChange={({ startDate, endDate }) => {
              setBillsStartDate(startDate);
              setBillsEndDate(endDate);
            }}
            showPagination
            paginationInfo={{
              total: pagination?.total || 0,
              current: Number(pagination?.page) || 1,
              pageSize: Number(pagination?.limit) || 10,
            }}
            onPageChange={(page) => {
              if (!estateId) return;
              const shouldApplyDate = Boolean(billsStartDate && billsEndDate);
              dispatch(
                getBillsByEstate({
                  estateId,
                  page,
                  limit: 10,
                  startDate: shouldApplyDate ? billsStartDate : undefined,
                  endDate: shouldApplyDate ? billsEndDate : undefined,
                }),
              )
                .unwrap()
                .catch(() => toast.error("Failed to change page"));
            }}
            enableExport
            exportFileName="bills"
            onExportRequest={
              estateId
                ? async () => {
                    const shouldApplyDate = Boolean(
                      billsStartDate && billsEndDate,
                    );
                    const res = await dispatch(
                      getBillsByEstate({
                        estateId,
                        page: 1,
                        limit: 50000,
                        startDate: shouldApplyDate
                          ? billsStartDate
                          : undefined,
                        endDate: shouldApplyDate ? billsEndDate : undefined,
                      }),
                    ).unwrap();
                    return res?.data ?? [];
                  }
                : undefined
            }
          />
        </Card>

        {open && estateId && (
          <Modal visible={open} onClose={handleCloseModal}>
            <BillsForm
              estateId={estateId}
              initialData={selectedBill}
              onSubmit={handleSubmitBill}
            />
          </Modal>
        )}

        {assignModalOpen && estateId && (
          <Modal visible={assignModalOpen} onClose={closeAssignModal}>
            <BillForAddressForm
              estateId={estateId}
              onSubmit={handleAssignBillForAddress}
              onClose={closeAssignModal}
            />
          </Modal>
        )}

        <SuspendRentModal
          visible={!!suspendBillItem}
          onClose={() => setSuspendBillItem(null)}
          tenantName={suspendBillItem?.name ?? "this bill"}
          title="Suspend bill"
          confirmLabel="Suspend"
          onConfirm={handleSuspendConfirm}
          loading={suspendSubmitting}
        />
      </div>
    </div>
  );
}
