"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { RevenueHeader } from "@/components/dashboard/admin/revenue/RevenueHeader";
import { RevenueFiltersBar } from "@/components/dashboard/admin/revenue/RevenueFiltersBar";
import { RevenueHeadCard } from "@/components/dashboard/admin/revenue/RevenueHeadCard";
import {
  RevenueHeadModal,
  type RevenueHeadModalValues,
} from "@/components/dashboard/admin/revenue/RevenueHeadModal";
import { ViewRevenueHeadModal } from "@/components/dashboard/admin/revenue/ViewRevenueHeadModal";
import { confirmDeleteToast } from "@/lib/confirm-delete-toast";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import {
  createRevenueHead,
  deleteRevenueHead,
  fetchRevenueHeads,
  fetchRevenueHeadById,
  updateRevenueHead,
  type RevenueHead,
} from "@/redux/slice/admin/revenue-head/revenue-head";
import {
  selectRevenueHeads,
  selectRevenueHeadsError,
  selectRevenueHeadsLoading,
  selectRevenueHeadsPagination,
} from "@/redux/slice/admin/revenue-head/revenue-head-slice";
import type { AppDispatch, RootState } from "@/redux/store";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/pagination/page";

const PAGE_SIZE = 12;

function normalizeEstate(user: any): { estateId: string; estateName: string } {
  const rawEstateId = user?.estateId as
    | string
    | { id?: string; _id?: string; name?: string }
    | undefined;
  const estateId =
    typeof rawEstateId === "string"
      ? rawEstateId
      : rawEstateId?._id || rawEstateId?.id || "";

  const estateFromId =
    (rawEstateId as { name?: string } | undefined)?.name ?? "";
  const estateFromObj =
    (user?.estate as { name?: string } | undefined)?.name ?? "";
  const fallbackEstateName = (user?.estateName as string) ?? "";
  const estateName =
    estateFromId || estateFromObj || fallbackEstateName || "Estate";

  return { estateId, estateName };
}

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function getId(item: RevenueHead): string | undefined {
  return item.id ?? item._id;
}

export default function RevenueHeadsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectRevenueHeads(s));
  const loading = useSelector((s: RootState) => selectRevenueHeadsLoading(s));
  const error = useSelector((s: RootState) => selectRevenueHeadsError(s));
  const pagination = useSelector((s: RootState) =>
    selectRevenueHeadsPagination(s),
  );

  const [estateId, setEstateId] = useState<string>("");
  const [estateName, setEstateName] = useState("Estate");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueHead | null>(null);
  const [modalValues, setModalValues] = useState<RevenueHeadModalValues>({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewItem, setViewItem] = useState<RevenueHead | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const user = userRes?.data ?? userRes;
        const { estateId, estateName } = normalizeEstate(user);
        setEstateId(estateId);
        setEstateName(estateName);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to load user.");
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [estateId, startDate, endDate]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      fetchRevenueHeads({
        estateId,
        page,
        limit: PAGE_SIZE,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
      }),
    )
      .unwrap()
      .catch(() => toast.error("Failed to fetch revenue heads."));
  }, [dispatch, estateId, startDate, endDate, page]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return (items ?? []).filter((h) =>
      String(h.name ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const openAdd = () => {
    setEditing(null);
    setModalValues({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (item: RevenueHead) => {
    setEditing(item);
    setModalValues({
      name: item.name ?? "",
      description: item.description ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = (item: RevenueHead) => {
    const id = getId(item);
    if (!id) return;
    confirmDeleteToast({
      name: item.name,
      onConfirm: async () => {
        await dispatch(deleteRevenueHead(id)).unwrap();
        toast.success("Revenue head deleted.");
      },
    });
  };

  const handleView = async (item: RevenueHead) => {
    const id = getId(item);
    if (!id) return;
    setViewOpen(true);
    setViewLoading(true);
    setViewItem(null);
    try {
      const payload: any = await dispatch(fetchRevenueHeadById(id)).unwrap();
      setViewItem(payload?.data ?? payload ?? null);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load revenue head.");
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!estateId) {
      toast.warning("No estate found for this user.");
      return;
    }
    const name = modalValues.name.trim();
    const description = modalValues.description.trim() || undefined;
    if (!name) return;

    setSaving(true);
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) return;
        await dispatch(updateRevenueHead({ id, name, description })).unwrap();
        toast.success("Revenue head updated.");
      } else {
        await dispatch(
          createRevenueHead({ estateId, name, description }),
        ).unwrap();
        toast.success("Revenue head created.");
      }
      setModalOpen(false);
      setEditing(null);
      setModalValues({ name: "", description: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save revenue head.");
    } finally {
      setSaving(false);
    }
  };

  const total = pagination?.total ?? items.length ?? 0;

  const paginationInfo = {
    total: pagination?.total ?? items.length ?? 0,
    current: pagination?.currentPage ?? page,
    pageSize: pagination?.pageSize ?? PAGE_SIZE,
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const content = useMemo(() => {
    if (filtered.length === 0) {
      return (
        <p className="text-muted-foreground py-10 text-center md:col-span-2 xl:col-span-3 rounded-lg border border-border bg-muted/20">
          No revenue heads found.
        </p>
      );
    }
    return filtered.map((item) => (
      <RevenueHeadCard
        key={getId(item) ?? item.name}
        item={item}
        onView={handleView}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    ));
  }, [filtered, handleDelete, handleView]);

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading revenue heads..." />}

      <div
        className={`space-y-6${loading ? " pointer-events-none select-none" : ""}`}
      >
        {/* Stats Card */}
        <div className="grid grid-cols-1">
          <RevenueHeader
            title="Revenue Heads"
            estateName={estateName}
            onAddRevenue={openAdd}
            actionLabel="Add Revenue Head"
          />
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="font-heading text-2xl font-bold">{total}</p>
          </Card>
        </div>

        <RevenueFiltersBar
          startDate={startDate}
          endDate={endDate}
          search={search}
          defaultDateRangeDays={0}
          onStartDateChange={(v) => setStartDate(v)}
          onEndDateChange={(v) => setEndDate(v)}
          onResetDates={() => {
            setStartDate("");
            setEndDate("");
          }}
          onSearchChange={setSearch}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {content}
        </div>

        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          disabled={loading}
          itemLabel="revenue heads"
        />

        <RevenueHeadModal
          open={modalOpen}
          saving={saving}
          title={editing ? "Edit Revenue Head" : "Add Revenue Head"}
          submitLabel={editing ? "Update" : "Add"}
          values={modalValues}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setEditing(null);
              setModalValues({ name: "", description: "" });
            }
          }}
          onChange={setModalValues}
          onSubmit={handleSubmit}
        />

        <ViewRevenueHeadModal
          open={viewOpen}
          loading={viewLoading}
          item={viewItem}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) {
              setViewItem(null);
              setViewLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
}
