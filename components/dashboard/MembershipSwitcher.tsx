"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  getMemberships,
  switchMembership,
} from "@/redux/slice/auth-mgt/auth-mgt";
import { getDashboardPathForRole } from "@/lib/auth-dashboard-path";
import {
  membershipMatchesUser,
  normalizeMemberships,
  type NormalizedMembership,
} from "@/lib/memberships";
import { reconnectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
  className?: string;
};

export function MembershipSwitcher({
  collapsed = false,
  className,
}: Readonly<Props>) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, memberships, getMembershipsStatus, switchMembershipStatus } =
    useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const switching = switchMembershipStatus === "isLoading";
  const loading = getMembershipsStatus === "isLoading";

  const items = useMemo(
    () => normalizeMemberships({ data: memberships }),
    [memberships],
  );

  const active = useMemo(() => {
    const match = items.find((m) =>
      membershipMatchesUser(m, user as Record<string, unknown> | null),
    );
    return match ?? items.find((m) => m.isActive) ?? items[0] ?? null;
  }, [items, user]);

  useEffect(() => {
    if (!token) return;
    if (
      getMembershipsStatus === "isLoading" ||
      getMembershipsStatus === "succeeded"
    ) {
      return;
    }
    dispatch(getMemberships());
  }, [dispatch, token, getMembershipsStatus]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = async (membership: NormalizedMembership) => {
    if (switching) return;
    if (active?.key === membership.key) {
      setOpen(false);
      return;
    }

    try {
      const res = await dispatch(
        switchMembership({
          estateId: membership.estateId,
          companyId: membership.companyId,
        }),
      ).unwrap();

      const nextToken =
        (res?.accessToken as string | undefined) ?? token ?? undefined;
      if (nextToken) reconnectSocket(nextToken);

      const nextUser = (res?.data ?? user) as
        | { role?: string }
        | null
        | undefined;
      const path = getDashboardPathForRole(nextUser?.role ?? membership.role);

      toast.success(res?.message || `Switched to ${membership.label}`);
      setOpen(false);
      // Hard navigation clears estate-scoped client state after token scope change.
      window.location.assign(path);
    } catch (err: unknown) {
      const message =
        typeof err === "string"
          ? err
          : err &&
              typeof err === "object" &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : null;
      if (message) toast.error(message);
    }
  };

  if (!token) return null;
  if (!loading && items.length === 0) return null;

  const canSwitch = items.length > 1;
  const label = active?.label ?? (loading ? "Loading…" : "Select estate");
  const roleHint = active?.role
    ? active.role.charAt(0).toUpperCase() + active.role.slice(1)
    : null;

  if (collapsed) {
    if (!canSwitch) {
      return (
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground",
            className,
          )}
          title={label}
          aria-label={`Current membership: ${label}`}
        >
          {switching || loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
      );
    }

    return (
      <div className={cn("relative", className)} ref={rootRef}>
        <button
          type="button"
          title={label}
          disabled={switching || loading}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-background p-1 shadow-lg">
            {items.map((item) => (
              <MembershipOption
                key={item.key}
                item={item}
                active={active?.key === item.key}
                disabled={switching}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative min-w-0", className)} ref={rootRef}>
      {canSwitch ? (
        <button
          type="button"
          disabled={switching || (loading && items.length === 0)}
          onClick={() => setOpen((v) => !v)}
          className="flex max-w-[16rem] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
          aria-label={`Current membership: ${label}`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">
              {label}
            </span>
            {roleHint && (
              <span className="block truncate text-xs text-muted-foreground">
                {roleHint}
              </span>
            )}
          </span>
          {switching || loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      ) : (
        <div
          className="flex max-w-[16rem] items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm"
          aria-label={`Current membership: ${label}`}
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-foreground">
              {label}
            </span>
            {roleHint && (
              <span className="block truncate text-xs text-muted-foreground">
                {roleHint}
              </span>
            )}
          </span>
          {(switching || loading) && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {canSwitch && open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-1 shadow-lg">
          {items.map((item) => (
            <MembershipOption
              key={item.key}
              item={item}
              active={active?.key === item.key}
              disabled={switching}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MembershipOption({
  item,
  active,
  disabled,
  onSelect,
}: Readonly<{
  item: NormalizedMembership;
  active: boolean;
  disabled: boolean;
  onSelect: (item: NormalizedMembership) => void;
}>) {
  const roleLabel = item.role
    ? item.role.charAt(0).toUpperCase() + item.role.slice(1)
    : "Member";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(item)}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50",
        active && "bg-primary/5",
      )}
    >
      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {roleLabel}
          {item.residentType ? ` · ${item.residentType}` : ""}
        </span>
      </span>
      {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
