import React from "react";
import { Button } from "@/components/ui/button";
import Table from "@/components/tables/list/page";
import {
  TransactionsFilterBar,
  type EstateTransactionsFilters,
} from "@/components/estate-admin/transactions-filter-bar";

type Props = {
  frequency: string;
  bill: string;
  status: string;
  onFiltersChange: (filters: EstateTransactionsFilters) => void;
  frequencyOptions: { value: string; label: string }[];
  billOptions: { value: string; label: string }[];
  data: any[];
  columns: any[];
  emptyMessage: string;
  startDate: string;
  endDate: string;
  onDateRangeChange: (next: { startDate: string; endDate: string }) => void;
  paginationInfo: { total: number; current: number; pageSize: number };
  onPageChange: (p: number) => void;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onExportRequest?: () => Promise<any[]>;
};

export function PaidBillsTab({
  frequency,
  bill,
  status,
  onFiltersChange,
  frequencyOptions,
  billOptions,
  data,
  columns,
  emptyMessage,
  startDate,
  endDate,
  onDateRangeChange,
  paginationInfo,
  onPageChange,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onExportRequest,
}: Readonly<Props>) {
  return (
    <>
      <TransactionsFilterBar
        frequency={frequency}
        bill={bill}
        status={status}
        onFiltersChange={onFiltersChange}
        frequencyOptions={frequencyOptions}
        billOptions={billOptions}
        visible={true}
      />

      <div className="mt-4">
        <Table
          columns={columns}
          data={data}
          emptyMessage={emptyMessage}
          enableDateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
          showPagination
          paginationInfo={paginationInfo}
          onPageChange={onPageChange}
          enableExport
          exportFileName="paid-bills"
          onExportRequest={onExportRequest}
        />
      </div>

      <div className="flex justify-end items-center gap-2 mt-4">
        <Button disabled={currentPage === 1} onClick={onPrev}>
          Prev
        </Button>
        <Button
          disabled={totalPages <= 1 || currentPage >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </>
  );
}

