"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/redux/store";
import { fetchExpenseHeads } from "@/redux/slice/admin/expense-head/expense-head";
import { selectExpenseHeads } from "@/redux/slice/admin/expense-head/expense-head-slice";
import {
  fetchExpenseChart,
  type ExpenseChartPeriod,
} from "@/redux/slice/estate-admin/expense-chart/expense-chart";
import {
  selectExpenseChartData,
  selectExpenseChartError,
  selectExpenseChartLoading,
} from "@/redux/slice/estate-admin/expense-chart/expense-chart-slice";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  IsoLinkedRangeEnd,
  IsoLinkedRangeStart,
} from "@/components/ui/iso-date-picker";
import { getDateRangePlaceholders } from "@/lib/date-range-placeholders";
import { ExpenseChartBarChart } from "./ExpenseChartBarChart";
import { buildExpenseChartSeries } from "./expense-chart-series";

function toIsoIfPresent(dateInputValue: string): string | undefined {
  if (!dateInputValue) return undefined;
  const d = new Date(`${dateInputValue}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

interface ExpenseChartCardProps {
  estateId: string;
}

export function ExpenseChartCard({ estateId }: Readonly<ExpenseChartCardProps>) {
  const dispatch = useDispatch<AppDispatch>();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [period, setPeriod] = useState<ExpenseChartPeriod>("monthly");
  const [headId, setHeadId] = useState("all");

  const datePlaceholders = useMemo(() => getDateRangePlaceholders(), []);

  const chartData = useSelector((s: RootState) => selectExpenseChartData(s));
  const loading = useSelector((s: RootState) => selectExpenseChartLoading(s));
  const error = useSelector((s: RootState) => selectExpenseChartError(s));
  const expenseHeads = useSelector((s: RootState) => selectExpenseHeads(s));

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(fetchExpenseHeads({ estateId, page: 1, limit: 500 })).catch(
      () => {},
    );
  }, [estateId, dispatch]);

  useEffect(() => {
    if (!estateId) return;
    dispatch(
      fetchExpenseChart({
        estateId,
        period,
        startDate: toIsoIfPresent(startDate),
        endDate: toIsoIfPresent(endDate),
        headId: headId !== "all" ? headId : undefined,
      }),
    )
      .unwrap()
      .catch((e: { message?: string }) =>
        toast.error(e?.message ?? "Failed to fetch expense chart."),
      );
  }, [estateId, startDate, endDate, period, headId, dispatch]);

  const series = useMemo(() => buildExpenseChartSeries(chartData), [chartData]);

  const headOptions = useMemo(
    () => [
      { label: "All Expense Heads", value: "all" },
      ...expenseHeads.map((h) => ({
        label: h.name,
        value: h.id ?? h._id ?? "",
      })),
    ],
    [expenseHeads],
  );

  function exportCsv() {
    if (!series.length) return toast.info("Nothing to export yet.");

    const headers = ["label", "value", "count"];
    const body = series.map((r) => [r.label, r.value, r.count].join(","));

    const csv = [headers.join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense_chart_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div>
          <p className="font-heading text-xl font-bold">Expense Chart</p>
          <p className="text-sm text-muted-foreground">
            Expense totals over time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label
              className="text-sm text-muted-foreground"
              htmlFor="expense-chart-start"
            >
              From
            </label>
            <IsoLinkedRangeStart
              id="expense-chart-start"
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              placeholder={datePlaceholders.start}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              className="text-sm text-muted-foreground"
              htmlFor="expense-chart-end"
            >
              To
            </label>
            <IsoLinkedRangeEnd
              id="expense-chart-end"
              startDate={startDate}
              endDate={endDate}
              onEndChange={setEndDate}
              placeholder={datePlaceholders.end}
              className="cursor-pointer"
            />
          </div>

          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ExpenseChartPeriod)}
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "Yearly", value: "yearly" },
            ]}
            className="w-[140px] cursor-pointer"
          />

          <Select
            value={headId}
            onChange={(e) => setHeadId(e.target.value)}
            options={headOptions}
            className="w-[190px] cursor-pointer"
          />

          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={series.length === 0}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            Export
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <ExpenseChartBarChart loading={loading} series={series} />
      </div>
    </Card>
  );
}
