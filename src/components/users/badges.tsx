import clsx from "clsx";
import { ShieldCheck } from "lucide-react";
import { roleLabels } from "@/lib/labels";
import type { UserRole } from "@/types/auth";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        role === "super_admin" ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700",
      )}
    >
      {role === "super_admin" && <ShieldCheck className="size-3.5" aria-hidden />}
      {roleLabels[role]}
    </span>
  );
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600",
      )}
    >
      <span className={clsx("size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-gray-400")} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
