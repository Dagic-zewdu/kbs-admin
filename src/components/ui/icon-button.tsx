import type { LucideIcon } from "lucide-react";

/** Small icon-only button; the label is its tooltip and accessible name */
export function IconButton({ icon: Icon, label, ...props }: { icon: LucideIcon; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30 md:size-9"
      {...props}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
