"use client";

import clsx from "clsx";
import type { Option } from "@/types/advisor";

interface ChoiceChipsProps {
  label: string;
  hint?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  /** The most that can be chosen */
  max?: number;
  /** Values that can't be chosen (chosen elsewhere) */
  disabled?: string[];
}

/** Choose any number of options by tapping them */
export function ChoiceChips({ label, hint, options, value, onChange, max, disabled = [] }: ChoiceChipsProps) {
  const isFull = max !== undefined && value.length >= max;
  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1.5 font-normal text-gray-500">{hint}</span>}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isChosen = value.includes(option.value);
          const isDisabled = !isChosen && (isFull || disabled.includes(option.value));
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isChosen}
              disabled={isDisabled}
              onClick={() => onChange(isChosen ? value.filter((item) => item !== option.value) : [...value, option.value])}
              className={clsx(
                "min-h-9 rounded-full border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                isChosen ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
