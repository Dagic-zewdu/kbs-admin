import { RequiredMark } from "@/components/ui/required-mark";

export const inputClasses =
  "h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

export function Field({ label, isRequired, children }: { label: string; isRequired?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </span>
      {children}
    </label>
  );
}
