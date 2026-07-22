import { VisitorVerificationMode } from "@/redux/slice/super-admin/super-admin-est-mgt/super-admin-est-mgt";

export type VisitorVerificationFlags = {
  mode: VisitorVerificationMode;
  showViewedBy: boolean;
  showVerifiedBy: boolean;
  canVerify: boolean;
  /** Viewing/scanning is enough to admit (no verify button). */
  viewOnly: boolean;
  /** Verify is the primary action (no separate "allow access" wording). */
  verifyOnly: boolean;
  viewAndVerify: boolean;
};

export function resolveVisitorVerificationMode(
  data: Record<string, unknown> | null | undefined,
): VisitorVerificationMode | null {
  if (!data) return null;

  const direct = data.visitorVerificationMode;
  if (typeof direct === "string" && direct.trim()) {
    return normalizeMode(direct);
  }

  const memberships = data.memberships;
  if (Array.isArray(memberships)) {
    const current =
      memberships.find((m: { isCurrent?: boolean }) => m?.isCurrent) ??
      memberships[0];
    const estate = (current as { estateId?: unknown } | undefined)?.estateId;
    const fromMembership = modeFromEstateLike(estate);
    if (fromMembership) return fromMembership;
  }

  const fromEstateId = modeFromEstateLike(data.estateId);
  if (fromEstateId) return fromEstateId;

  const fromEstate = modeFromEstateLike(data.estate);
  if (fromEstate) return fromEstate;

  return null;
}

function modeFromEstateLike(value: unknown): VisitorVerificationMode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const mode = (value as { visitorVerificationMode?: string })
    .visitorVerificationMode;
  return typeof mode === "string" && mode.trim() ? normalizeMode(mode) : null;
}

function normalizeMode(mode: string): VisitorVerificationMode {
  const upper = mode.toUpperCase().trim();
  if (upper === VisitorVerificationMode.VIEW_ONLY) {
    return VisitorVerificationMode.VIEW_ONLY;
  }
  if (upper === VisitorVerificationMode.VERIFY_ONLY) {
    return VisitorVerificationMode.VERIFY_ONLY;
  }
  return VisitorVerificationMode.VIEW_AND_VERIFY;
}

export function getVerificationFlags(
  mode: string | null | undefined,
): VisitorVerificationFlags {
  const normalized = normalizeMode(mode ?? VisitorVerificationMode.VIEW_AND_VERIFY);

  switch (normalized) {
    case VisitorVerificationMode.VIEW_ONLY:
      return {
        mode: normalized,
        showViewedBy: true,
        showVerifiedBy: false,
        canVerify: false,
        viewOnly: true,
        verifyOnly: false,
        viewAndVerify: false,
      };
    case VisitorVerificationMode.VERIFY_ONLY:
      return {
        mode: normalized,
        showViewedBy: false,
        showVerifiedBy: true,
        canVerify: true,
        viewOnly: false,
        verifyOnly: true,
        viewAndVerify: false,
      };
    case VisitorVerificationMode.VIEW_AND_VERIFY:
    default:
      return {
        mode: VisitorVerificationMode.VIEW_AND_VERIFY,
        showViewedBy: true,
        showVerifiedBy: true,
        canVerify: true,
        viewOnly: false,
        verifyOnly: false,
        viewAndVerify: true,
      };
  }
}

export function resolveVisitorVerificationDescription(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data) return null;
  const direct = data.visitorVerificationDescription;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return null;
}
