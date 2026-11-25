"use client";

import clsx from "clsx";
import { forwardRef, useId } from "react";
import { RequiredMark } from "./required-mark";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; isRequired?: boolean; error?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, isRequired, error, className, id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {isRequired && <RequiredMark />}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={4}
        aria-required={isRequired}
        aria-invalid={Boolean(error)}
        className={clsx(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2",
          error ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand-500 focus:ring-brand-100",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
