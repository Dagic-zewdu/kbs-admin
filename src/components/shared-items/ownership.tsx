import clsx from "clsx";
import type { CreatedBy } from "@/types/shared-item";

const labels: Record<CreatedBy, string> = { us: "You", platform: "Platform", company: "Another company" };

export function CreatedByBadge({ createdBy }: { createdBy: CreatedBy }) {
  return (
    <span
      className={clsx(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        createdBy === "us" ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-600",
      )}
    >
      {labels[createdBy]}
    </span>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={clsx(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
