import clsx from "clsx";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Alert({ type = "error", children }: { type?: "error" | "success"; children: React.ReactNode }) {
  if (!children) return null;
  const Icon = type === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
