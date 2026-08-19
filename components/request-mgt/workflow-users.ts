import axiosInstance from "@/utils/axiosInstance";
import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import { getCompanyUsersByCompany } from "@/redux/slice/company/user-mgt/company-user";
import type { AppDispatch } from "@/redux/store";
import { normalizeUserId } from "@/lib/user-id";

export const WORKFLOW_USER_ROLES = [
  { value: "estate admin", label: "Estate admin" },
  { value: "admin", label: "Admin" },
  { value: "company", label: "Company" },
  { value: "staff", label: "Staff" },
] as const;

export type WorkflowUserRole = (typeof WORKFLOW_USER_ROLES)[number]["value"];

const ESTATE_WORKFLOW_ROLES = WORKFLOW_USER_ROLES.filter(
  (role) => role.value !== "company",
);

const EXCLUDED_ROLES = new Set([
  "resident",
  "security",
  "energy provider",
  "energyprovider",
]);

export type WorkflowEstateUser = {
  id: string;
  name: string;
  role: WorkflowUserRole;
  roleLabel: string;
  label: string;
};

function normalizeRoleKey(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function toWorkflowUserRole(raw: unknown): WorkflowUserRole | null {
  const key = normalizeRoleKey(raw);
  if (!key || EXCLUDED_ROLES.has(key) || EXCLUDED_ROLES.has(key.replace(/\s/g, ""))) {
    return null;
  }
  return WORKFLOW_USER_ROLES.find((role) => role.value === key)?.value ?? null;
}

export function formatWorkflowRoleLabel(role: string) {
  const key = normalizeRoleKey(role);
  return (
    WORKFLOW_USER_ROLES.find((item) => item.value === key)?.label ??
    role.replaceAll("_", " ")
  );
}

export function formatWorkflowUserName(raw: Record<string, unknown>): string {
  const first = String(raw.firstName ?? "").trim();
  const last = String(raw.lastName ?? "").trim();
  const name = [first, last].filter(Boolean).join(" ");
  const email = String(raw.email ?? "").trim();
  return name || email || "User";
}

function resolveCompanyIdFromPayload(
  raw: Record<string, unknown> | null | undefined,
): string {
  if (!raw) return "";
  const companyRef = raw.companyId ?? raw.company;
  if (typeof companyRef === "string") return companyRef.trim();
  if (companyRef && typeof companyRef === "object") {
    return String(
      (companyRef as Record<string, unknown>)._id ??
        (companyRef as Record<string, unknown>).id ??
        "",
    ).trim();
  }
  return "";
}

async function resolveEstateCompanyId(
  estateId: string,
  companyId?: string | null,
): Promise<string> {
  const provided = companyId?.trim();
  if (provided) return provided;

  try {
    const res = await axiosInstance.get(`/api/v1/estate-mgt/${estateId}`);
    const payload = (res.data?.data ?? res.data) as Record<string, unknown>;
    return resolveCompanyIdFromPayload(payload);
  } catch {
    return "";
  }
}

function appendWorkflowUsers(
  users: WorkflowEstateUser[],
  seen: Set<string>,
  list: Record<string, unknown>[],
  fallbackRole: WorkflowUserRole,
) {
  list.forEach((u) => {
    const id = normalizeUserId(u._id ?? u.id ?? u.userId);
    const role = toWorkflowUserRole(u.role) ?? fallbackRole;
    if (!id || seen.has(id) || !role) return;
    seen.add(id);
    const name = formatWorkflowUserName(u);
    const email = String(u.email ?? "").trim();
    users.push({
      id,
      name,
      role,
      roleLabel: formatWorkflowRoleLabel(role),
      label: email && name !== email ? `${name} (${email})` : name,
    });
  });
}

export async function fetchWorkflowEstateUsers(
  dispatch: AppDispatch,
  estateId: string,
  companyId?: string | null,
): Promise<WorkflowEstateUser[]> {
  const resolvedCompanyId = await resolveEstateCompanyId(estateId, companyId);

  const [estateResults, companyResult] = await Promise.all([
    Promise.all(
      ESTATE_WORKFLOW_ROLES.map((role) =>
        dispatch(
          getAllUsersByEstate({
            estateId,
            page: 1,
            limit: 200,
            role: role.value,
          }),
        ).unwrap(),
      ),
    ),
    resolvedCompanyId
      ? dispatch(
          getCompanyUsersByCompany({
            companyId: resolvedCompanyId,
            page: 1,
            limit: 200,
            role: "company",
          }),
        ).unwrap()
      : Promise.resolve(null),
  ]);

  const seen = new Set<string>();
  const users: WorkflowEstateUser[] = [];

  estateResults.forEach((res, index) => {
    const fallbackRole = ESTATE_WORKFLOW_ROLES[index].value;
    const list = Array.isArray(res?.data) ? res.data : [];
    appendWorkflowUsers(users, seen, list, fallbackRole);
  });

  if (companyResult) {
    const list = Array.isArray(companyResult?.data) ? companyResult.data : [];
    appendWorkflowUsers(users, seen, list, "company");
  }

  return users;
}
