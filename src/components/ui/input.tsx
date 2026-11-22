"use client";

import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

/** Text input with a label and an error message underneath. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, type = "text", id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={clsx(
            "h-11 w-full rounded-lg border bg-white px-3 sm:h-10 text-sm text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2",
            error ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand-500 focus:ring-brand-100",
            isPassword && "pr-10",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
