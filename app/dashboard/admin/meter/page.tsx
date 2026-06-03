"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import Table from "@/components/tables/list/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "lucide-react";
import {
  getAllEstateMeter,
  getVendingStatsByEstate,
} from "@/redux/slice/admin/meter-mgt/meter-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import AssignMeterForm from "@/components/admin/meter-form/page";
import { IoSpeedometerOutline } from "react-icons/io5";
import Loader from "@/components/ui/Loader";

interface VendorData {
  name: string;
  device: string;
  refName: string;
  refCode: string;
  address: string;
  maxVend: string;
  minVend: string;
  status: number;
  utilityName: string;
  time: string;
}

interface AdminMeterData {
  id?: string;
  meterNumber: string;
  isActive?: boolean;
  isAssigned?: boolean;
  estateId?: string;
  lastCredit?: number;
  createdAt?: string;
  updatedAt?: string;
  addressId: {
    id: string;
    data: Record<string, string>;
  };
  vendorData?: VendorData;
}

const PAGE_LIMIT = 10;

/** Placeholder until estate-wide usage API is wired. */
const HARDCODED_TOTAL_ENERGY_KWH = 12_450;

function formatPurchasedAmount(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export default function AdminMeterManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [estateId, setEstateId] = useState<string | null>(null);
  const [estateName, setEstateName] = useState("Estate");
  const [selectedMeter, setSelectedMeter] = useState<AdminMeterData | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const { allAdminMeters, pagination, loading } = useSelector(
    (state: RootState) => {
      const adminMeterState = state.adminMeter as any;
      return {
        allAdminMeters: adminMeterState?.allAdminMeters?.data || [],
        pagination: adminMeterState?.allAdminMeters?.pagination || {},
        loading:
          adminMeterState.getAllEstateMeterState === "isLoading" ||
          adminMeterState.getMeterState === "isLoading",
      };
    },
  );

  const vendingStats = useSelector(
    (state: RootState) => state.adminMeter.vendingStatsByEstate,
  );
  const vendingStatsLoading =
    useSelector(
      (state: RootState) => state.adminMeter.getVendingStatsByEstateState,
    ) === "isLoading";

  const fetchMeters = useCallback(
    async (page = 1) => {
      if (!estateId) return;
      await dispatch(
        getAllEstateMeter({
          estateId,
          page,
          limit: PAGE_LIMIT,
          search: search || undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, search],
  );

  // Bootstrap signed-in user and estate only (no meter fetch here).
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const data = userRes?.data ?? (userRes as Record<string, unknown>);
        const foundEstateId = data?.estateId as
          | string
          | { id?: string; _id?: string }
          | undefined;
        const estateIdValue =
          typeof foundEstateId === "string"
            ? foundEstateId
            : foundEstateId?._id || foundEstateId?.id || "";

        const estateFromId =
          (foundEstateId as { name?: string } | undefined)?.name ?? "";
        const estateFromObj =
          (data?.estate as { name?: string } | undefined)?.name ?? "";
        const fallbackEstateName = (data?.estateName as string) ?? "";
        const name =
          estateFromId || estateFromObj || fallbackEstateName || "Estate";
        setEstateName(name);

        if (!estateIdValue) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(estateIdValue);
      } catch (error: any) {
        toast.error(error?.message);
      }
    })();
  }, [dispatch]);

  // Single fetch when estate or search changes.
  useEffect(() => {
    if (!estateId) return;
    fetchMeters(1).catch((error: any) => toast.error(error?.message));
  }, [estateId, fetchMeters]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(getVendingStatsByEstate({ estateId })).catch((error: any) =>
      toast.error(error?.message ?? "Failed to load vending statistics."),
    );
  }, [dispatch, estateId]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchMeters(Number(pagination?.currentPage) || 1),
        estateId
          ? dispatch(getVendingStatsByEstate({ estateId })).unwrap()
          : Promise.resolve(),
      ]);
    } catch (error: any) {
      toast.error(error?.message);
    }
  };

  const handleOpenModal = (meter?: AdminMeterData) => {
    setSelectedMeter(meter || null);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMeter(null);
    setOpen(false);
  };

  const getAllAddressKeys = (data: AdminMeterData[]) => {
    const keys = new Set<string>();
    data.forEach((item) => {
      if (item.addressId?.data) {
        Object.keys(item.addressId.data).forEach((key) => keys.add(key));
      }
    });
    return Array.from(keys);
  };

  const getAddressColumns = (data: AdminMeterData[]) => {
    if (!data.length) return [];
    const addressKeys = getAllAddressKeys(data);
    return addressKeys.map((key) => ({
      key: `address_${key}`,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase()),
      render: (item: AdminMeterData) => item.addressId?.data?.[key] ?? "-",
    }));
  };

  const columns = [
    { key: "createdAt", header: "Created Date" },
    { key: "meterNumber", header: "Meter Number" },
    ...getAddressColumns(allAdminMeters),
    {
      key: "isActive",
      header: "Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "isAssigned",
      header: "Assigned Status",
      render: (item: AdminMeterData) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.isAssigned
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {item.isAssigned ? "Assigned" : "Not Assigned"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Assign Meter",
      render: (item: AdminMeterData) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(item)}
            className="hover:bg-blue-100"
          >
            <Link className="w-4 h-4 text-blue-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Loader label="Loading estate meters..." />
        </div>
      )}

      <div
        className={[
          "space-y-6",
          loading ? "blur-sm opacity-60 pointer-events-none select-none" : "",
        ].join(" ")}
      >
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">
          Estate Meter Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage all energy meters in {" "}
          <span className="text-[18px] font-bold underline uppercase text-black">
            {estateName || ""}
          </span>
          .
        </p>
      </div>

      {/* Stats Card */}
      <Card className="p-6 md:p-8 shadow-md">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 shrink-0">
            <p className="text-sm text-muted-foreground">Total Meters</p>
            <p className="font-heading text-4xl font-bold mt-2 tabular-nums tracking-tight">
              {pagination?.total ?? 0}
            </p>
          </div>

          <div className="flex flex-1 items-stretch rounded-xl border border-border bg-muted/40 max-w-2xl">
            <div className="flex flex-1 flex-col justify-center p-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Total Energy Consumed
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {HARDCODED_TOTAL_ENERGY_KWH.toLocaleString()} kWh
              </p>
            </div>
            <div
              className="w-px shrink-0 self-stretch bg-border my-4"
              aria-hidden
            />
            <div className="flex flex-1 flex-col justify-center p-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Total Amount Purchased
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {vendingStatsLoading
                  ? "—"
                  : formatPurchasedAmount(
                      Number(vendingStats?.totalAmount) || 0,
                    )}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#FEE6D480] shrink-0 self-start xl:self-center">
            <IoSpeedometerOutline className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <input
          type="text"
          placeholder="Search by meter number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </Card>

      <Card className="p-4">
        <Table
          columns={columns}
          data={allAdminMeters || []}
          emptyMessage="No meter found."
          showPagination
          // enableSearch
          onSearch={(value) => setSearch(value)}
          paginationInfo={{
            total: pagination?.total || 0,
            current: Number(pagination?.currentPage) || 1,
            pageSize: Number(pagination?.pageSize) || 10,
          }}
          onPageChange={(page) => {
            fetchMeters(page).catch(() =>
              toast.error("Failed to change page"),
            );
          }}
          enableExport
          exportFileName="meters"
          onExportRequest={
            estateId
              ? async () => {
                  const res = await dispatch(
                    getAllEstateMeter({
                      estateId,
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

      {open && estateId && selectedMeter && (
        <Modal visible={open} onClose={handleCloseModal}>
          <AssignMeterForm
            close={handleCloseModal}
            refresh={handleRefresh}
            meterNumber={selectedMeter.meterNumber}
          />
        </Modal>
      )}
      </div>
    </div>
  );
}
