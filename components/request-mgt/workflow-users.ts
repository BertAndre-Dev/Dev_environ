import { getAllUsersByEstate } from "@/redux/slice/admin/user-mgt/user";
import type { AppDispatch } from "@/redux/store";
import { normalizeUserId } from "@/lib/user-id";

export const WORKFLOW_USER_ROLES = [
  { value: "estate admin", label: "Estate admin" },
  { value: "admin", label: "Admin" },
  { value: "company", label: "Company" },
  { value: "staff", label: "Staff" },
] as const;

export type WorkflowUserRole = (typeof WORKFLOW_USER_ROLES)[number]["value"];

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

export async function fetchWorkflowEstateUsers(
  dispatch: AppDispatch,
  estateId: string,
): Promise<WorkflowEstateUser[]> {
  const results = await Promise.all(
    WORKFLOW_USER_ROLES.map((role) =>
      dispatch(
        getAllUsersByEstate({
          estateId,
          page: 1,
          limit: 200,
          role: role.value,
        }),
      ).unwrap(),
    ),
  );

  const seen = new Set<string>();
  const users: WorkflowEstateUser[] = [];

  results.forEach((res, index) => {
    const fallbackRole = WORKFLOW_USER_ROLES[index].value;
    const list = Array.isArray(res?.data) ? res.data : [];
    list.forEach((u: Record<string, unknown>) => {
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
  });

  return users;
}
