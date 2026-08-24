import type { InvitedUserData } from "@/redux/slice/auth-mgt/auth-mgt";

/** Role value for POST /api/v1/auth-mgt/invite-user */
export const ENERGY_PROVIDER_ROLE = "energy provider" as const;

export const SUPER_ADMIN_ESTATE_INVITE_ROLE_OPTIONS = [
  { value: "estate admin", label: "Estate Admin" },
  { value: "admin", label: "Admin" },
  { value: ENERGY_PROVIDER_ROLE, label: "Energy Provider" },
] as const;

export const SUPER_ADMIN_COMPANY_INVITE_ROLE_OPTIONS = [
  { value: "company", label: "Company" },
  { value: ENERGY_PROVIDER_ROLE, label: "Energy Provider" },
] as const;

export const COMPANY_INVITE_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: ENERGY_PROVIDER_ROLE, label: "Energy Provider" },
] as const;

export type CompanyInviteRole =
  (typeof COMPANY_INVITE_ROLE_OPTIONS)[number]["value"];

export function getCompanyInviteLabel(role: CompanyInviteRole): string {
  if (role === ENERGY_PROVIDER_ROLE) return "Invite energy provider";
  if (role === "staff") return "Invite staff";
  return "Invite admin";
}

export const ADMIN_INVITE_ROLES = ["resident", "staff", "security"] as const;

export type AdminInviteRole = (typeof ADMIN_INVITE_ROLES)[number];

export function isAdminInviteRole(role: string): role is AdminInviteRole {
  return (ADMIN_INVITE_ROLES as readonly string[]).includes(
    role.trim().toLowerCase(),
  );
}

export function getAdminInviteLabel(role: AdminInviteRole): string {
  if (role === "staff") return "Invite staff";
  if (role === "security") return "Invite security";
  return "Invite resident";
}

export const ENERGY_PROVIDER_INVITE_ROLE_OPTIONS = [
  { value: "resident", label: "Home owner" },
] as const;

/** Payload for energy provider inviting a home owner (residentType: owner). */
export function buildEnergyProviderInviteHomeOwnerPayload(params: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  estateId: string;
  companyId?: string;
  addressIds: string[];
}): InvitedUserData {
  const estateId = params.estateId.trim();
  const trimmedCompanyId = params.companyId?.trim();
  const phoneNumber = params.phoneNumber?.trim();

  return {
    firstName: params.firstName.trim(),
    lastName: params.lastName.trim(),
    email: params.email.trim(),
    role: "resident",
    residentType: "owner",
    estateId,
    ...(trimmedCompanyId ? { companyId: trimmedCompanyId } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    addressIds: params.addressIds
      .map((id) => String(id).trim())
      .filter(Boolean),
  };
}

export function isEnergyProviderRole(role: string): boolean {
  return role.trim().toLowerCase() === ENERGY_PROVIDER_ROLE;
}

/** Phone is collected for every invited user, regardless of role. */
export function inviteRoleRequiresPhoneNumber(_role?: string): boolean {
  return true;
}

export function inviteRequiresDesignation(role: string): boolean {
  return role.trim().toLowerCase() === "staff";
}

export function validateEnergyProviderInviteScope(params: {
  role: string;
  inviteContext: "estate" | "company";
  estateId?: string;
  companyId?: string;
}): string | null {
  const estateId = params.estateId?.trim() ?? "";
  const companyId = params.companyId?.trim() ?? "";

  if (!isEnergyProviderRole(params.role)) return null;

  if (params.inviteContext === "estate") {
    if (!estateId) return "Please select an estate.";
    return null;
  }

  if (!companyId) return "Please select a company.";
  if (!estateId) return "Please select an estate.";
  return null;
}

export function buildInviteUserPayload(params: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  inviteContext: "estate" | "company";
  estateId?: string;
  companyId?: string;
  designationId?: string;
  modules?: string[];
  residentType?: string | null;
  addressIds?: string[];
}): InvitedUserData {
  const estateId = params.estateId?.trim();
  const companyId = params.companyId?.trim();
  const phoneNumber = params.phoneNumber?.trim();
  const designationId = params.designationId?.trim();
  const modules = (params.modules ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const isResident = params.role.trim().toLowerCase() === "resident";
  const addressIds = (params.addressIds ?? [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  const base: InvitedUserData = {
    firstName: params.firstName.trim(),
    lastName: params.lastName.trim(),
    email: params.email.trim(),
    role: params.role,
    residentType: isResident ? (params.residentType ?? "owner") : null,
    addressIds: isResident ? addressIds : [],
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(designationId ? { designationId } : {}),
    ...(modules.length ? { modules } : {}),
  };

  if (isEnergyProviderRole(params.role)) {
    if (params.inviteContext === "estate" && estateId) {
      return { ...base, estateId };
    }
    if (params.inviteContext === "company" && companyId && estateId) {
      return { ...base, companyId, estateId };
    }
    return base;
  }

  if (params.inviteContext === "estate" && estateId) {
    return { ...base, estateId };
  }
  if (params.inviteContext === "company" && companyId) {
    return {
      ...base,
      companyId,
      ...(estateId ? { estateId } : {}),
    };
  }

  return base;
}
