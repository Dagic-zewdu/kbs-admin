import clsx from "clsx";
import { Sparkles } from "lucide-react";

/** tone="light" is for dark backgrounds */
/** compact hides the subtitle (used in the narrow mobile top bar) */
export function Logo({
  subtitle = "Admin",
  tone = "dark",
  compact = false,
}: {
  subtitle?: string;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={clsx(
          "flex size-9 items-center justify-center rounded-xl",
          tone === "light" ? "bg-white text-brand-600" : "bg-brand-600 text-white",
        )}
      >
        <Sparkles className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 truncate leading-tight">
        <span className={clsx("block text-sm font-semibold", tone === "light" ? "text-white" : "text-gray-900")}>KBS Cosmetics</span>
        <span className={clsx("block text-xs", compact && "hidden", tone === "light" ? "text-brand-100" : "text-gray-500")}>{subtitle}</span>
      </span>
    </div>
  );
}
