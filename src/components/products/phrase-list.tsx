"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface PhraseListProps {
  label: string;
  hint?: string;
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  max: number;
  /** Letters in each */
  maxLength: number;
  /** A comma starts the next one. Off for sentences. */
  splitOnComma?: boolean;
}

/** Short texts, added one by one with Enter */
export function PhraseList({ label, hint = "Press Enter after each", placeholder, value, onChange, max, maxLength, splitOnComma }: PhraseListProps) {
  const [text, setText] = useState("");
  const isFull = value.length >= max;
  const add = () => {
    const next = [...value];
    for (const part of splitOnComma ? text.split(",") : [text]) {
      const phrase = part.trim().slice(0, maxLength);
      if (phrase.length >= 2 && !next.some((item) => item.toLowerCase() === phrase.toLowerCase())) next.push(phrase);
    }
    if (next.length > value.length) onChange(next.slice(0, max));
    setText("");
  };

  return (
    <div className="space-y-2">
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-gray-700">
          {label} <span className="font-normal text-gray-500">{isFull ? `At most ${max}` : hint}</span>
        </span>
        <input
          value={text}
          maxLength={splitOnComma ? 300 : maxLength}
          disabled={isFull}
          onChange={(event) => setText(event.target.value)}
          onBlur={add}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault(); // never submits the form
              add();
            }
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 sm:h-10"
        />
      </label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((phrase) => (
            <li key={phrase} className="flex max-w-full items-center gap-1 rounded-2xl bg-gray-100 pl-3 text-sm text-gray-700">
              <span className="min-w-0 break-words py-1">{phrase}</span>
              <button
                type="button"
                aria-label={`Remove ${phrase}`}
                onClick={() => onChange(value.filter((item) => item !== phrase))}
                className="flex size-8 shrink-0 items-center justify-center rounded-full hover:text-red-700"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
