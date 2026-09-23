"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MARKETPLACE_FEED_ESTATE_KEY,
  marketplaceFeedNeedsEstateId,
  resolveEstateId,
} from "@/lib/marketplace";
import { selectUserRole } from "@/redux/slice/auth-mgt/auth-mgt-slice";
import { getCompanyEstates } from "@/redux/slice/company/estate-mgt/company-estate";
import { getEnergyProviderEstates } from "@/redux/slice/energy-provider/estate-mgt/energy-provider-estate";
import { getAllEstates } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";
import type { AppDispatch, RootState } from "@/redux/store";

export type FeedEstateOption = { label: string; value: string };

function mapEstateRows(rows: unknown): FeedEstateOption[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const item = row as { id?: string; _id?: string; name?: string };
      const value = String(item._id || item.id || "").trim();
      if (!value) return null;
      return { label: item.name ?? "Unnamed estate", value };
    })
    .filter((row): row is FeedEstateOption => Boolean(row));
}

function readStoredEstateId(): string {
  try {
    return sessionStorage.getItem(MARKETPLACE_FEED_ESTATE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function writeStoredEstateId(estateId: string) {
  try {
    if (estateId) sessionStorage.setItem(MARKETPLACE_FEED_ESTATE_KEY, estateId);
    else sessionStorage.removeItem(MARKETPLACE_FEED_ESTATE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Resolves which estateId to pass on GET /api/v1/marketplace.
 * Estate-bound roles omit it (JWT membership). Company / energy provider /
 * super admin must pass an explicit estateId.
 */
export function useMarketplaceFeedEstate() {
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector(selectUserRole);
  const user = useSelector((state: RootState) => state.auth.user);
  const needsEstateId = marketplaceFeedNeedsEstateId(role);
  const jwtEstateId = resolveEstateId(user?.estateId);

  const companyEstates = useSelector(
    (state: RootState) => state.companyEstate.allEstates?.data ?? [],
  );
  const energyProviderEstates = useSelector(
    (state: RootState) => state.energyProviderEstate.allEstates?.data ?? [],
  );
  const superAdminEstates = useSelector(
    (state: RootState) => state.estate.allEstates?.data ?? [],
  );

  const [selectedEstateId, setSelectedEstateId] = useState("");
  const [estatesLoaded, setEstatesLoaded] = useState(!needsEstateId);

  const estateOptions = useMemo(() => {
    if (!needsEstateId) return [] as FeedEstateOption[];
    if (role === "company") return mapEstateRows(companyEstates);
    if (role === "energy provider") return mapEstateRows(energyProviderEstates);
    return mapEstateRows(superAdminEstates);
  }, [
    companyEstates,
    energyProviderEstates,
    needsEstateId,
    role,
    superAdminEstates,
  ]);

  useEffect(() => {
    if (!needsEstateId) {
      setEstatesLoaded(true);
      return;
    }

    let cancelled = false;
    setEstatesLoaded(false);

    const load = async () => {
      try {
        if (role === "company") {
          await dispatch(getCompanyEstates({ page: 1, limit: 200 })).unwrap();
        } else if (role === "energy provider") {
          await dispatch(
            getEnergyProviderEstates({ page: 1, limit: 200 }),
          ).unwrap();
        } else {
          await dispatch(getAllEstates({ page: 1, limit: 200 })).unwrap();
        }
      } catch {
        // Caller treats empty options as "no estate available".
      } finally {
        if (!cancelled) setEstatesLoaded(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [dispatch, needsEstateId, role]);

  useEffect(() => {
    if (!needsEstateId) {
      setSelectedEstateId("");
      return;
    }
    if (!estatesLoaded || estateOptions.length === 0) return;

    const stored = readStoredEstateId();
    const preferred =
      (stored && estateOptions.some((o) => o.value === stored) ? stored : "") ||
      (jwtEstateId &&
      estateOptions.some((o) => o.value === jwtEstateId)
        ? jwtEstateId
        : "") ||
      estateOptions[0]?.value ||
      "";

    setSelectedEstateId((prev) => {
      if (prev && estateOptions.some((o) => o.value === prev)) return prev;
      if (preferred) writeStoredEstateId(preferred);
      return preferred;
    });
  }, [estateOptions, estatesLoaded, jwtEstateId, needsEstateId]);

  const setEstateId = useCallback((next: string) => {
    setSelectedEstateId(next);
    writeStoredEstateId(next);
  }, []);

  const estateId = needsEstateId ? selectedEstateId : undefined;
  const ready = !needsEstateId || (estatesLoaded && Boolean(selectedEstateId));

  return {
    needsEstateId,
    estateId,
    estateOptions,
    setEstateId,
    ready,
    estatesLoaded,
  };
}
