"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  canShowOverviewChart,
  extractUserDesignationId,
  getUserAssignedModules,
  resolveOverviewModules,
  type OverviewChartId,
} from "@/lib/overview-chart-modules";
import {
  selectEstateModules,
  selectUserRole,
} from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getDesignationById } from "@/redux/slice/designations/designations";
import type { AppDispatch, RootState } from "@/redux/store";

export function useOverviewChartAccess() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector(selectUserRole);
  const estateModules = useSelector(selectEstateModules);
  const [designationModules, setDesignationModules] = useState<string[] | null>(
    null,
  );
  const [loadingDesignation, setLoadingDesignation] = useState(false);

  const assignedFromUser = useMemo(
    () => getUserAssignedModules(user),
    [user],
  );
  const designationId = useMemo(
    () => extractUserDesignationId(user),
    [user],
  );
  const isStaff = role === "staff";

  useEffect(() => {
    if (!isStaff) {
      setDesignationModules(null);
      setLoadingDesignation(false);
      return;
    }
    if (assignedFromUser && assignedFromUser.length > 0) {
      setDesignationModules(null);
      setLoadingDesignation(false);
      return;
    }
    if (!designationId) {
      setDesignationModules([]);
      setLoadingDesignation(false);
      return;
    }

    let cancelled = false;
    setLoadingDesignation(true);
    void dispatch(getDesignationById(designationId))
      .unwrap()
      .then((payload) => {
        if (cancelled) return;
        setDesignationModules(payload.item.modules ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setDesignationModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDesignation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assignedFromUser, designationId, dispatch, isStaff]);

  const modules = useMemo(() => {
    if (!isStaff) {
      return resolveOverviewModules(user, estateModules);
    }
    return Array.from(
      new Set([...(assignedFromUser ?? []), ...(designationModules ?? [])]),
    );
  }, [
    assignedFromUser,
    designationModules,
    estateModules,
    isStaff,
    user,
  ]);

  return useMemo(() => {
    const canShow = (chart: OverviewChartId) =>
      canShowOverviewChart(modules, chart);
    return {
      canShow,
      modulesReady: !isStaff || !loadingDesignation,
      showUserSummary: isStaff || canShow("userSummary"),
      showRoleBreakdown: isStaff || canShow("roleBreakdown"),
      showMeterSummary: canShow("meterSummary"),
      showBillsSummary: canShow("billsSummary"),
      showComplaintsSummary: canShow("complaintsSummary"),
      showComplaintsDashboard: canShow("complaintsDashboard"),
    };
  }, [isStaff, loadingDesignation, modules]);
}
