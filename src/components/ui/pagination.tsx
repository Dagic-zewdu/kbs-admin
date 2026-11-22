import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const buttonClasses =
  "flex size-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 sm:size-8";

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
      <p className="min-w-0">
        <span className="font-medium text-gray-900">{firstItem}</span>–<span className="font-medium text-gray-900">{lastItem}</span> of{" "}
        <span className="font-medium text-gray-900">{total}</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={buttonClasses} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <span className="whitespace-nowrap tabular-nums">
          <span className="hidden sm:inline">Page </span>
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={buttonClasses} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
