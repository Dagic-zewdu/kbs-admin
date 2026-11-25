import type { UserRole } from "@/types/auth";

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  user: "User",
};

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

/** "2028-08-31" as a date, without time zone shifts */
export const formatDay = (value: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export const formatPrice = (value: number | null) =>
  value === null ? "—" : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`;
