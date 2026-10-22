"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  membershipMatchesUser,
  normalizeMemberships,
} from "@/lib/memberships";
import { resolveCurrentEstateName } from "@/lib/marketplace";
import type { RootState } from "@/redux/store";

export function useCurrentEstateName(): string {
  const user = useSelector((state: RootState) => state.auth.user);
  const memberships = useSelector(
    (state: RootState) => state.auth.memberships,
  );
  return useMemo(() => {
    const estates = normalizeMemberships({ data: memberships }).filter(
      (item) => item.estateId,
    );
    const record =
      user && typeof user === "object"
        ? (user as Record<string, unknown>)
        : null;
    const active =
      estates.find((item) => membershipMatchesUser(item, record)) ??
      estates.find((item) => item.isActive) ??
      estates[0];
    const label = active?.label?.trim() ?? "";
    if (label && !label.startsWith("Estate ")) return label;
    return resolveCurrentEstateName(user, memberships);
  }, [memberships, user]);
}
