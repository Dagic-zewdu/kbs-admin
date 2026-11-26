import clsx from "clsx";
import { Check } from "lucide-react";

/** 1 MB and up in MB, smaller in KB */
export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** What Optimize does to every photo (the server's photo optimizer, PC3.2 and PC3.3) */
export const OPTIMIZE_STEPS = [
  "Background removed and made white",
  "Product cut out cleanly, specks of table removed",
  "Centred on a square, 1600 × 1600 px",
  "Light and contrast corrected on the product",
  "Warm or blue room light softened",
  "Soft shadow right under the product",
  "Sharpened, so the label reads clearly",
  "Saved as WebP: small, still sharp",
];

interface PhotoSizesProps {
  /** Bytes of the photo as taken or uploaded */
  original?: number;
  /** Bytes of the optimized copy, when there is one */
  optimized?: number;
  tone?: "light" | "dark";
}

/** The photo's size, and when optimized: both sizes, how much smaller, and what was done */
export function PhotoSizes({ original, optimized, tone = "light" }: PhotoSizesProps) {
  const isDark = tone === "dark";
  const muted = isDark ? "text-white/70" : "text-gray-500";
  if (optimized === undefined) {
    if (original === undefined) return null;
    return <p className={clsx("text-sm", muted)}>Photo size: <strong className={isDark ? "text-white" : "text-gray-900"}>{formatBytes(original)}</strong></p>;
  }
  const saved = original ? Math.round((1 - optimized / original) * 100) : null;
  return (
    <div className={clsx("space-y-1.5 text-sm", isDark ? "text-white" : "text-gray-900")}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className={muted}>Original</span>
        <strong>{original ? formatBytes(original) : "—"}</strong>
        <span aria-hidden className={muted}>→</span>
        <span className={muted}>Optimized</span>
        <strong className={isDark ? "text-emerald-300" : "text-emerald-700"}>{formatBytes(optimized)}</strong>
        {saved !== null && saved > 0 && <span className={muted}>({saved}% smaller)</span>}
      </p>
      <details className="group">
        <summary className={clsx("cursor-pointer select-none font-medium", isDark ? "text-white/90" : "text-brand-700")}>What was optimized</summary>
        <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
          {OPTIMIZE_STEPS.map((step) => (
            <li key={step} className="flex items-start gap-1.5">
              <Check className={clsx("mt-0.5 size-4 shrink-0", isDark ? "text-emerald-300" : "text-emerald-600")} aria-hidden />
              <span className={isDark ? "text-white/85" : "text-gray-700"}>{step}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
