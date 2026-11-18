import type { UserRole } from "@/types/auth";

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  user: "User",
};
