import clsx from "clsx";
import { ShieldCheck } from "lucide-react";

/** A supplier added by the platform: every company can use it, only the platform changes it */
export function PlatformBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 font-medium text-brand-700",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-xs",
      )}
    >
      <ShieldCheck className={size === "md" ? "size-3.5" : "size-3"} aria-hidden /> From the platform
    </span>
  );
}
