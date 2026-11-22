import clsx from "clsx";
import { Sparkles } from "lucide-react";

/**
 * The company's logo and name once known (signed in, or ?company= on the login page),
 * otherwise the generic E-commerce Cosmetics mark.
 * tone="light" is for dark backgrounds; compact hides the subtitle (narrow mobile top bar).
 */
export function Logo({
  name = "E-commerce Cosmetics",
  logoUrl,
  subtitle = "Admin",
  tone = "dark",
  compact = false,
}: {
  name?: string;
  logoUrl?: string | null;
  subtitle?: string;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
        <img src={logoUrl} alt="" className="size-9 shrink-0 rounded-xl border border-gray-200 bg-white object-contain" />
      ) : (
        <span
          className={clsx(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            tone === "light" ? "bg-white text-brand-600" : "bg-brand-600 text-white",
          )}
        >
          <Sparkles className="size-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0 truncate leading-tight">
        <span className={clsx("block truncate text-sm font-semibold", tone === "light" ? "text-white" : "text-gray-900")}>{name}</span>
        <span className={clsx("block text-xs", compact && "hidden", tone === "light" ? "text-brand-100" : "text-gray-500")}>{subtitle}</span>
      </span>
    </div>
  );
}
