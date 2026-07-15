import type { Membership } from "@/redux/slice/auth-mgt/auth-mgt";
import { extractEstateId, normalizeUserId } from "@/lib/user-id";

export type NormalizedMembership = {
  key: string;
  estateId: string | null;
  companyId: string | null;
  label: string;
  role: string;
  residentType: string | null;
  isActive: boolean;
};

function extractNamedId(raw: unknown): { id: string | null; name: string | null } {
  if (raw == null) return { id: null, name: null };
  if (typeof raw === "string") {
    const id = raw.trim();
    return { id: id || null, name: null };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const id = normalizeUserId(o._id ?? o.id) || null;
    const name =
      typeof o.name === "string" && o.name.trim() ? o.name.trim() : null;
    return { id, name };
  }
  return { id: null, name: null };
}

function asMembershipArray(payload: unknown): Membership[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;

  if (Array.isArray(data)) return data as Membership[];
  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.memberships)) return obj.memberships as Membership[];
  if (Array.isArray(obj.estates) || Array.isArray(obj.companies)) {
    const estates = Array.isArray(obj.estates) ? (obj.estates as Membership[]) : [];
    const companies = Array.isArray(obj.companies)
      ? (obj.companies as Membership[])
      : [];
    return [...estates, ...companies];
  }
  return [];
}

export function normalizeMemberships(payload: unknown): NormalizedMembership[] {
  return asMembershipArray(payload)
    .map((m, index) => {
      const estate = extractNamedId(m.estateId);
      const company = extractNamedId(m.companyId);
      const estateId = estate.id;
      const companyId = company.id;
      const estateName =
        (typeof m.estateName === "string" && m.estateName.trim()) ||
        estate.name ||
        null;
      const companyName =
        (typeof m.companyName === "string" && m.companyName.trim()) ||
        company.name ||
        null;

      const label =
        estateName ||
        companyName ||
        (estateId ? `Estate ${estateId.slice(-6)}` : null) ||
        (companyId ? `Company ${companyId.slice(-6)}` : null) ||
        `Membership ${index + 1}`;

      const role = (m.role ?? "").toString().trim();
      const key = [estateId ?? "", companyId ?? "", role, String(index)].join(
        ":",
      );

      return {
        key,
        estateId,
        companyId,
        label,
        role,
        residentType:
          typeof m.residentType === "string" ? m.residentType : null,
        isActive: Boolean(m.isActive),
      };
    })
    .filter((m) => m.estateId || m.companyId);
}

export function membershipMatchesUser(
  membership: NormalizedMembership,
  user: Record<string, unknown> | null | undefined,
): boolean {
  if (!user) return membership.isActive;
  const userEstateId = extractEstateId(user.estateId) ?? extractEstateId(user.estate);
  const userCompanyRaw = user.companyId ?? user.company;
  const userCompanyId = extractNamedId(userCompanyRaw).id;
  const userRole =
    typeof user.role === "string" ? user.role.toLowerCase() : "";
  const memberRole = membership.role.toLowerCase();

  const estateOk =
    !membership.estateId ||
    !userEstateId ||
    membership.estateId === userEstateId;
  const companyOk =
    !membership.companyId ||
    !userCompanyId ||
    membership.companyId === userCompanyId;
  const roleOk = !memberRole || !userRole || memberRole === userRole;

  if (membership.isActive && estateOk && companyOk) return true;
  return estateOk && companyOk && roleOk && Boolean(userEstateId || userCompanyId);
}
