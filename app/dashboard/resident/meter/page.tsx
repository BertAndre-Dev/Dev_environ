'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal/page";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMeterByAddress,
  reconnectMeter,
  disconnectMeter,
  getMeterVendHistory,
  getVendingStatsByAddress,
} from "@/redux/slice/resident/meter-mgt/meter-mgt";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { normalizeAddresses } from "@/lib/address";
import SwitchAddress from "@/components/resident/switch-address/page";
import VendPower from "@/components/resident/vend-power/page";
import Table from "@/components/tables/list/page";
import type { EnergyListItem } from "@/redux/slice/resident/meter-mgt/meter-mgt-slice";
import Loader from "@/components/ui/Loader";
import { CopyButton } from "@/components/ui/copy-button";

/** Placeholder until consumption totals API is wired */
const HARDCODED_TOTAL_ENERGY_CONSUMED_KWH = 28_000;

function formatMeterBalance(balance: number | null | undefined): string {
  const n = Number(balance);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatPurchasedAmount(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export default function ResidentMeter() {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [addressOptions, setAddressOptions] = useState<{ id: string; data?: Record<string, string> }[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const { meterVendHistory, pagination, loading } = useSelector((state: RootState) => {
    const vendState = state.residentMeter as any
    const data = vendState.meterVendHistory?.data || []
    const pagination = vendState.meterVendHistory?.pagination || {}
    return {
      meterVendHistory: Array.isArray(data) ? data : [],
      pagination,
      loading: vendState.loading || false,
    }
  })

  const meter = useSelector((state: RootState) => state.residentMeter.residentMeter);
  const vendingStats = useSelector(
    (state: RootState) => state.residentMeter.vendingStatsByAddress,
  );
  const vendingStatsLoading =
    useSelector(
      (state: RootState) => state.residentMeter.getVendingStatsByAddressState,
    ) === "isLoading";

  // Load user and normalize addresses (addressIds for owners, addressId for tenants)
  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const foundWalletId: string | null = userRes?.data?.walletId ?? null;
        setWalletId(foundWalletId);

        const addresses = normalizeAddresses(userRes?.data ?? {});
        if (addresses.length === 0) {
          toast.warning("No address attached to your account.");
          return;
        }

        setAddressOptions(addresses);
        setSelectedAddressId((prev) => {
          const firstId = addresses[0].id;
          return prev ?? firstId;
        });
      } catch (error: any) {
        const message = error?.message ?? "Failed to load user";
        toast.error(message);
      }
    })();
  }, [dispatch]);

  // Fetch meter when selected address changes
  useEffect(() => {
    if (!selectedAddressId) return;
    (async () => {
      try {
        await dispatch(getMeterByAddress({ addressId: selectedAddressId })).unwrap();
      } catch (error: any) {
        const message = error?.message ?? "Failed to fetch meter";
        toast.error(message);
      }
    })();
  }, [dispatch, selectedAddressId]);

  useEffect(() => {
    if (!selectedAddressId) return;
    dispatch(getVendingStatsByAddress({ addressId: selectedAddressId })).catch(
      (error: { message?: string }) => {
        toast.error(error?.message ?? "Failed to load purchase total.");
      },
    );
  }, [dispatch, selectedAddressId]);

  useEffect(() => {
    if (meter?.meterNumber) {
      dispatch(
        getMeterVendHistory({
          meterNumber: meter.meterNumber,
          page: 1,
          limit: 10,
        })
      );
    }
  }, [meter?.meterNumber]);


  const handleRefresh = async () => {
    if (!selectedAddressId) return;
    try {
      await Promise.all([
        dispatch(getMeterByAddress({ addressId: selectedAddressId })).unwrap(),
        dispatch(
          getVendingStatsByAddress({ addressId: selectedAddressId }),
        ).unwrap(),
      ]);
    } catch (error: any) {
      const message = error?.message ?? "Failed to refresh meter";
      toast.error(message);
    }
  };

  const handleAddressChange = (addressId: string) => setSelectedAddressId(addressId);

  const handleOpenModal = () => setOpen((prev) => !prev);

  const handleToggleMeter = async () => {
    if (!meter || !selectedAddressId) return;

    try {
      if (meter.isActive) {
        // Disconnect
        await dispatch(disconnectMeter({ meterNumber: meter.meterNumber })).unwrap();
        toast.success("Meter disconnected successfully");
      } else {
        // Reconnect
        await dispatch(reconnectMeter({ meterNumber: meter.meterNumber })).unwrap();
        toast.success("Meter reconnected successfully");
      }
      // Refresh meter data after toggling
      await handleRefresh();
    } catch (error: any) {
      toast.error("Failed to toggle meter status");
    }
  };


  const handleVendPageChange = (newPage: number) => {
    if (!meter?.meterNumber) return;
    dispatch(
      getMeterVendHistory({
        meterNumber: meter.meterNumber,
        page: newPage,
        limit: Number(pagination?.limit) || 10,
      })
    );
  };

  const vendColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (row: EnergyListItem) => {
        if (!row.createdAt) return "N/A";
        const date = new Date(row.createdAt);
        return date.toLocaleString("en-NG", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      },
    },
    {
      key: "amount",
      header: "Amount (₦)",
      render: (row: EnergyListItem) => Number(row.amount).toLocaleString(),
    },
    {
      key: "units",
      header: "Units Bought",
      render: (row: EnergyListItem) => `${row.value} ${row.unit}`,
    },
    {
      key: "receiptNo",
      header: "Receipt No",
      render: (row: EnergyListItem) => row.receiptNo ?? "—",
    },
    {
      key: "token",
      header: "Token",
      render: (row: EnergyListItem) => {
        if (!row.token) return "N/A";
        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[180px]">{row.token}</span>
            <CopyButton value={row.token} title="Copy token" />
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price (₦/kWh)",
      render: (row: EnergyListItem) =>
        row.price ? Number(row.price).toLocaleString() : "N/A",
    },
    {
      key: "device",
      header: "Meter Number",
      render: (row: EnergyListItem) => row.device,
    },
  ];



  return (
    <div className="space-y-6">
      <SwitchAddress
        addresses={addressOptions}
        value={selectedAddressId}
        onChange={handleAddressChange}
      />

      <Card className="p-6 md:p-8 shadow-md">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 shrink-0">
            <h2 className="text-xl font-semibold tracking-tight">My Meter</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Current Energy Balance
            </p>
            <p className="text-4xl font-bold mt-2 tabular-nums tracking-tight">
              {formatMeterBalance(meter?.balance)}{" "}
              <span className="text-3xl font-bold">kWh</span>
            </p>
          </div>

          <div className="flex flex-1 items-stretch rounded-xl border border-border bg-muted/40 max-w-2xl">
            <div className="flex flex-1 flex-col justify-center p-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                Total Energy Consumed
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {HARDCODED_TOTAL_ENERGY_CONSUMED_KWH.toLocaleString()} kWh
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              onClick={handleOpenModal}
              size="lg"
              className="w-full sm:w-auto px-8 text-white hover:opacity-90"
              style={{ backgroundColor: "#0150AC" }}
            >
              Buy Power
            </Button>
            <Button
              onClick={handleToggleMeter}
              size="lg"
              className="w-full sm:w-auto px-8"
              variant={meter?.isActive ? "destructive" : "default"}
            >
              {meter?.isActive ? "Disconnect Meter" : "Reconnect Meter"}
            </Button>
          </div>
        </div>
      </Card>


      <Card className="p-4">
          <h2 className="font-semibold mb-4">Vend History</h2>
          <Table
            columns={vendColumns}
            data={meterVendHistory || []}
            emptyMessage={
              loading
                ? <Loader label="Loading vend history..." />
                : "No vend history available."
            }
            showPagination
            paginationInfo={{
              total: pagination?.total ?? meterVendHistory.length ?? 0,
              current: Number(pagination?.page) || 1,
              pageSize: Number(pagination?.limit) || 10,
            }}
            onPageChange={handleVendPageChange}
            enableExport
            exportFileName="meter-vend-history"
            onExportRequest={
              meter?.meterNumber
                ? async () => {
                    const res = await dispatch(
                      getMeterVendHistory({
                        meterNumber: meter.meterNumber,
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

      {open && meter && walletId && selectedAddressId && (
        <Modal visible={open} onClose={handleOpenModal}>
          <VendPower
            walletId={walletId}
            meterNumber={meter?.meterNumber ?? ""}
            tariffPrice={meter?.currentTariff?.price ?? null}
            onSubmitSuccess={handleRefresh}
            onClose={handleOpenModal}
          />
        </Modal>
      )}
    </div>
  );
}
