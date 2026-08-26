"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  canShowOverviewChart,
  resolveOverviewModules,
  type OverviewChartId,
} from "@/lib/overview-chart-modules";
import { selectEstateModules } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import type { RootState } from "@/redux/store";

export function useOverviewChartAccess() {
  const user = useSelector((state: RootState) => state.auth.user);
  const estateModules = useSelector(selectEstateModules);
  const modules = useMemo(
    () => resolveOverviewModules(user, estateModules),
    [user, estateModules],
  );

  return useMemo(() => {
    const canShow = (chart: OverviewChartId) =>
      canShowOverviewChart(modules, chart);
    return {
      canShow,
      showUserSummary: canShow("userSummary"),
      showRoleBreakdown: canShow("roleBreakdown"),
      showMeterSummary: canShow("meterSummary"),
      showBillsSummary: canShow("billsSummary"),
      showComplaintsSummary: canShow("complaintsSummary"),
      showComplaintsDashboard: canShow("complaintsDashboard"),
    };
  }, [modules]);
}
