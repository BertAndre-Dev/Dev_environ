export type PaidByPerson = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export function paidByName(person?: PaidByPerson | null): string {
  if (!person) return "";
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
}

export function paidByEmail(person?: PaidByPerson | null): string {
  return typeof person?.email === "string" ? person.email.trim() : "";
}

export function paidByNameLabel(person?: PaidByPerson | null): string {
  return paidByName(person) || paidByEmail(person) || "-";
}

export function paidByEmailLabel(person?: PaidByPerson | null): string {
  return paidByEmail(person) || "-";
}

export function paidByExportLabel(person?: PaidByPerson | null): string {
  const name = paidByName(person);
  const email = paidByEmail(person);
  if (name && email) return `${name} (${email})`;
  return name || email || "";
}
