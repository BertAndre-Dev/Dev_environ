"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import { RootState, AppDispatch } from "@/redux/store";
import { getSignedInUser } from "@/redux/slice/auth-mgt/auth-mgt";
import { getAllVisitors } from "@/redux/slice/security/visitor/visitor";
import type { SecurityVisitorItem } from "@/redux/slice/security/visitor/visitor-slice";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";

const DATE_RANGE_PLACEHOLDERS = getDateRangePlaceholders();
const PAGE_LIMIT = 10;

function formatDate(dateString: string) {
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAddressDisplay(addressId: SecurityVisitorItem["addressId"]) {
  if (!addressId?.data) return "—";
  const parts = Object.values(addressId.data).filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default function ActivityLogPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [estateId, setEstateId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { allVisitors, loading } = useSelector((state: RootState) => {
    const v = state.securityVisitor;
    return {
      allVisitors: v?.allVisitors ?? null,
      loading: v?.getAllVisitorsStatus === "isLoading",
    };
  });

  const list = useMemo(() => allVisitors?.data ?? [], [allVisitors?.data]);
  const rawPagination = allVisitors?.pagination;
  const pagination = useMemo(() => {
    if (!rawPagination) return undefined;
    const total = rawPagination.total ?? list.length;
    const limit = rawPagination.limit ?? PAGE_LIMIT;
    const page = rawPagination.page ?? 1;
    const totalPages =
      (rawPagination as { totalPages?: number }).totalPages ??
      Math.ceil(Math.max(total, 1) / limit);
    return { ...rawPagination, total, limit, page, totalPages };
  }, [rawPagination, list.length]);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((row: SecurityVisitorItem) => {
      const resident = row.residentId
        ? `${row.residentId.firstName} ${row.residentId.lastName}`.toLowerCase()
        : "";
      const visitor = `${row.firstName} ${row.lastName}`.toLowerCase();
      const purpose = (row.purpose ?? "").toLowerCase();
      const address = getAddressDisplay(row.addressId).toLowerCase();
      return [resident, visitor, purpose, address].some((s) => s.includes(q));
    });
  }, [list, search]);

  const fetchVisitors = useCallback(
    async (page = 1) => {
      if (!estateId) return;
      const shouldApplyDate = Boolean(startDate && endDate);
      await dispatch(
        getAllVisitors({
          estateId,
          page,
          limit: PAGE_LIMIT,
          startDate: shouldApplyDate ? startDate : undefined,
          endDate: shouldApplyDate ? endDate : undefined,
        }),
      ).unwrap();
    },
    [dispatch, estateId, startDate, endDate],
  );

  useEffect(() => {
    (async () => {
      try {
        const userRes = await dispatch(getSignedInUser()).unwrap();
        const rawEstateId =
          userRes?.data?.estateId ?? userRes?.data?.estate ?? null;
        const foundEstateId =
          typeof rawEstateId === "string"
            ? rawEstateId
            : (rawEstateId as { id?: string; _id?: string })?._id ||
              (rawEstateId as { id?: string; _id?: string })?.id ||
              "";

        if (!foundEstateId) {
          toast.warning("No estate found for this user");
          return;
        }

        setEstateId(foundEstateId);
      } catch (error: unknown) {
        toast.error(
          (error as { message?: string })?.message ?? "Failed to load visitors",
        );
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!estateId) return;
    fetchVisitors(1).catch(() => toast.error("Failed to fetch visitors"));
  }, [estateId, fetchVisitors]);

  const onPageChange = (page: number) => {
    fetchVisitors(page).catch((err: unknown) =>
      toast.error(
        (err as { message?: string })?.message ?? "Failed to load page",
      ),
    );
  };

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Date",
        render: (row: SecurityVisitorItem) => formatDate(row.createdAt),
      },
      {
        key: "visitorName",
        header: "Visitor Name",
        render: (row: SecurityVisitorItem) =>
          `${row.firstName} ${row.lastName}`,
      },
      {
        key: "residentName",
        header: "Resident Name",
        render: (row: SecurityVisitorItem) =>
          row.residentId
            ? `${row.residentId.firstName} ${row.residentId.lastName}`
            : "—",
      },
      {
        key: "phone",
        header: "Phone",
        render: (row: SecurityVisitorItem) => row.phone ?? "N/A",
      },
      {
        key: "address",
        header: "Address",
        render: (row: SecurityVisitorItem) => getAddressDisplay(row.addressId),
      },
      {
        key: "purpose",
        header: "Purpose",
        render: (row: SecurityVisitorItem) => row.purpose ?? "N/A",
      },
      {
        key: "visitorCode",
        header: "Visitor Code",
        render: (row: SecurityVisitorItem) => row.visitorCode ?? "N/A",
      },
      {
        key: "viewedBy",
        header: "Viewed By",
        render: (row: SecurityVisitorItem) => row.viewedBy?.firstName ?? "N/A",
      },
      {
        key: "verifiedBy",
        header: "Verified By",
        render: (row: SecurityVisitorItem) =>
          row.verifiedBy?.firstName ?? "N/A",
      },
      {
        key: "isVerified",
        header: "Status",
        render: (row: SecurityVisitorItem) => (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              row.isVerified
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {row.isVerified ? "Verified" : "Not verified"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="relative">
      {loading && <Loader fullScreen label="Loading visitors..." />}

      <div
        className={`space-y-6${loading ? " pointer-events-none select-none" : ""}`}
      >
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">
            Welcome back! View all visitors and activity for your estate.
          </p>
        </div>

        <Card className="p-4">
          <input
            type="text"
            placeholder="Search resident, visitor, purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table<SecurityVisitorItem>
              columns={columns}
              data={filtered}
              emptyMessage="No visitors found."
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={startDate}
              endDate={endDate}
              startDatePlaceholder={DATE_RANGE_PLACEHOLDERS.start}
              endDatePlaceholder={DATE_RANGE_PLACEHOLDERS.end}
              onDateRangeChange={({ startDate: nextStart, endDate: nextEnd }) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
              }}
              showPagination={
                !!pagination &&
                (pagination.total > pagination.limit ||
                  (pagination.totalPages ?? 1) > 1)
              }
              paginationInfo={
                pagination
                  ? {
                      total: pagination.total,
                      current: pagination.page,
                      pageSize: pagination.limit,
                    }
                  : undefined
              }
              onPageChange={onPageChange}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
