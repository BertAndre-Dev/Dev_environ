"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { Card } from "@/components/ui/card";
import Table from "@/components/tables/list/page";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import { getBillsByEstate } from "@/redux/slice/super-admin/super-admin-bills/super-admin-bills";
import type { BillItem } from "@/redux/slice/super-admin/super-admin-bills/super-admin-bills-slice";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { formatDateTime } from "@/lib/format-date";
import { formatAmountDisplay } from "@/lib/format-number";
import { ClipboardList } from "lucide-react";

const DATE_RANGE_PLACEHOLDERS = getDateRangePlaceholders();
const PAGE_LIMIT = 10;
const ESTATE_FILTER_FETCH_LIMIT = 500;

type EstateOption = { label: string; value: string };

export default function SuperAdminBillsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedEstate, setSelectedEstate] = useState<EstateOption | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { allEstates, estateLoading } = useSelector((state: RootState) => {
    const estateState = state.estate;
    const data = estateState.allEstates?.data || [];
    return {
      allEstates: Array.isArray(data) ? data : [],
      estateLoading: estateState.getAllEstatesState === "isLoading",
    };
  });

  const { bills, loading, error } = useSelector((state: RootState) => {
    const s = state.superAdminBills;
    return {
      bills: s?.bills ?? null,
      loading: s?.getBillsByEstateState === "isLoading",
      error: s?.error ?? null,
    };
  });

  const estateOptions: EstateOption[] = useMemo(
    () =>
      allEstates
        .map((e: { id?: string; _id?: string; name?: string }) => {
          const value = String(e?._id || e?.id || "").trim();
          if (!value) return null;
          return { label: e?.name ?? "Unnamed estate", value };
        })
        .filter((x): x is EstateOption => Boolean(x)),
    [allEstates],
  );

  const selectedEstateId = selectedEstate?.value;

  const fetchBills = useCallback(
    async (page = 1) => {
      if (!selectedEstateId) return;
      const shouldApplyDate = Boolean(startDate && endDate);
      try {
        await dispatch(
          getBillsByEstate({
            estateId: selectedEstateId,
            page,
            limit: PAGE_LIMIT,
            startDate: shouldApplyDate ? startDate : undefined,
            endDate: shouldApplyDate ? endDate : undefined,
          }),
        ).unwrap();
        setCurrentPage(page);
      } catch (err: unknown) {
        toast.error(
          (err as { message?: string })?.message ?? "Failed to fetch bills",
        );
      }
    },
    [dispatch, selectedEstateId, startDate, endDate],
  );

  useEffect(() => {
    dispatch(getAllEstates({ page: 1, limit: ESTATE_FILTER_FETCH_LIMIT }))
      .unwrap()
      .catch(() => toast.error("Failed to fetch estates"));
  }, [dispatch]);

  useEffect(() => {
    if (selectedEstate?.value) return;
    if (!estateOptions.length) return;
    setSelectedEstate(estateOptions[0]);
  }, [estateOptions, selectedEstate?.value]);

  useEffect(() => {
    if (!selectedEstateId) return;
    fetchBills(1).catch(() => {});
  }, [selectedEstateId, fetchBills]);

  const list = bills?.data ?? [];
  const pagination = bills?.pagination;

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: "Date",
        render: (item: BillItem) => formatDateTime(item.createdAt, "—"),
        exportValue: (item: BillItem) => formatDateTime(item.createdAt, ""),
      },
      {
        key: "name",
        header: "Bill Name",
        render: (item: BillItem) => item.name ?? "—",
        exportValue: (item: BillItem) => String(item.name ?? ""),
      },
      {
        key: "description",
        header: "Description",
        render: (item: BillItem) => item.description ?? "—",
        exportValue: (item: BillItem) => String(item.description ?? ""),
      },
      {
        key: "yearlyAmount",
        header: "Yearly Amount (₦)",
        render: (item: BillItem) => formatAmountDisplay(item.yearlyAmount),
        exportValue: (item: BillItem) =>
          item.yearlyAmount != null ? String(item.yearlyAmount) : "",
      },
      {
        key: "isActive",
        header: "Status",
        render: (item: BillItem) => (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              item.isActive
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {item.isActive ? "Active" : "Suspended"}
          </span>
        ),
        exportValue: (item: BillItem) =>
          item.isActive ? "Active" : "Suspended",
      },
    ],
    [],
  );

  const pageLoading = estateLoading || loading;

  return (
    <div className="relative">
      {pageLoading && <Loader fullScreen label="Loading bills..." />}

      <div
        className={`space-y-6${pageLoading ? " pointer-events-none select-none" : ""}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Bill Management</h1>
            <p className="text-muted-foreground mt-1">
              View all bills by estate.
            </p>
          </div>

          <div className="w-full md:w-72">
            <label className="text-sm text-muted-foreground mb-1 block">
              Filter by estate
            </label>
            <Select
              options={estateOptions}
              placeholder="Select estate"
              value={selectedEstate}
              onChange={(option) => {
                setSelectedEstate(option);
                setCurrentPage(1);
              }}
              isSearchable
              isLoading={estateLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total bills</p>
                <p className="font-heading text-2xl font-bold mt-2">
                  {pagination?.total ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#FEE6D480]">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          {!selectedEstateId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select an estate to view bills.
            </p>
          ) : (
            <Table<BillItem>
              columns={columns}
              data={list}
              emptyMessage={error ? error : "No bills found for this estate."}
              enableDateRangeFilter
              defaultDateRangeDays={0}
              startDate={startDate}
              endDate={endDate}
              startDatePlaceholder={DATE_RANGE_PLACEHOLDERS.start}
              endDatePlaceholder={DATE_RANGE_PLACEHOLDERS.end}
              onDateRangeChange={({
                startDate: nextStart,
                endDate: nextEnd,
              }) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
                setCurrentPage(1);
              }}
              showPagination={
                !!pagination &&
                (pagination.total > pagination.limit || pagination.pages > 1)
              }
              paginationInfo={
                pagination
                  ? {
                      total: pagination.total,
                      current: pagination.page || currentPage,
                      pageSize: pagination.limit || PAGE_LIMIT,
                    }
                  : undefined
              }
              onPageChange={(page) => {
                fetchBills(page).catch(() => {});
              }}
              enableExport
              exportFileName="bills"
              onExportRequest={
                selectedEstateId
                  ? async () => {
                      const shouldApplyDate = Boolean(startDate && endDate);
                      const res = await dispatch(
                        getBillsByEstate({
                          estateId: selectedEstateId,
                          page: 1,
                          limit: 50000,
                          startDate: shouldApplyDate ? startDate : undefined,
                          endDate: shouldApplyDate ? endDate : undefined,
                        }),
                      ).unwrap();
                      return res?.data ?? [];
                    }
                  : undefined
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
