import type { UserRole } from "@/types/auth";

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  user: "User",
};

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
