import clsx from "clsx";
import { Sparkles } from "lucide-react";

/** tone="light" is for dark backgrounds */
export function Logo({ subtitle = "Admin", tone = "dark" }: { subtitle?: string; tone?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-600 text-white ring-1 ring-white/20">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className={clsx("block text-sm font-semibold", tone === "light" ? "text-white" : "text-gray-900")}>KBS Cosmetics</span>
        <span className={clsx("block text-xs", tone === "light" ? "text-brand-200" : "text-gray-500")}>{subtitle}</span>
      </span>
    </div>
  );
}
