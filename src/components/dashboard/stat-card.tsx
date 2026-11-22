import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-semibold tabular-nums sm:mt-3 sm:text-2xl text-gray-900">{value}</p>
      <p className="mt-1 truncate text-xs text-gray-500">{hint}</p>
    </div>
  );
}
