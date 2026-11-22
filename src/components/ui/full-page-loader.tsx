import { Loader2 } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50">
      <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Loading" />
    </div>
  );
}
