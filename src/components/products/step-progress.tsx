"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

export type StepState = "current" | "done" | "needs" | "todo";

export type ProgressStep = { id: string; label: string; state: StepState };

const hints: Record<StepState, string> = {
  current: "You are here",
  done: "Done",
  needs: "Something is still needed to go live",
  todo: "Not opened yet",
};

/** Numbered steps joined by a line: done ones green with a tick, the open one highlighted, amber when something is missing */
export function StepProgress({ steps, onSelect }: { steps: ProgressStep[]; onSelect: (id: string) => void }) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.state === "current"),
  );
  const done = steps.filter((step) => step.state === "done").length;
  const percent = Math.round((done / steps.length) * 100);
  const current = steps[currentIndex];

  return (
    <nav aria-label="Steps" className="rounded-xl border border-gray-200 bg-white p-4 sm:px-6 sm:py-5">
      <div className="mb-4 flex items-baseline justify-between gap-3 sm:hidden">
        <p className="text-sm font-semibold text-gray-900">
          <span className="font-normal text-gray-500">
            Step {currentIndex + 1} of {steps.length} ·
          </span>{" "}
          {current?.label}
        </p>
        <p className="text-xs text-gray-500">{percent}% done</p>
      </div>

      <ol className="flex">
        {steps.map((step, index) => {
          const isReached = index <= currentIndex || step.state === "done";
          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center">
              {index > 0 && (
                <span
                  aria-hidden
                  className={clsx(
                    "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 sm:top-[18px]",
                    isReached && steps[index - 1].state !== "todo" ? "bg-brand-500" : "bg-gray-200",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={step.state === "current" ? "step" : undefined}
                title={`${step.label}: ${hints[step.state]}`}
                className="group relative z-10 flex flex-col items-center gap-2 rounded-lg px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <span
                  className={clsx(
                    "relative flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition sm:size-9",
                    step.state === "current" && "border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100",
                    step.state === "done" && "border-emerald-500 bg-emerald-500 text-white group-hover:bg-emerald-600",
                    step.state === "needs" && "border-amber-400 bg-amber-50 text-amber-800 group-hover:border-amber-500",
                    step.state === "todo" && "border-gray-200 bg-white text-gray-400 group-hover:border-brand-300 group-hover:text-brand-600",
                  )}
                >
                  {step.state === "done" ? <Check className="size-4" strokeWidth={3} aria-hidden /> : index + 1}
                  {step.state === "needs" && (
                    <span aria-hidden className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-amber-500" />
                  )}
                </span>
                <span
                  className={clsx(
                    "hidden text-center text-xs leading-tight sm:block",
                    step.state === "current" ? "font-semibold text-gray-900" : "font-medium text-gray-500 group-hover:text-gray-800",
                  )}
                >
                  {step.label}
                </span>
                <span className="sr-only">{hints[step.state]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="hidden shrink-0 text-xs text-gray-500 sm:block">
          {done} of {steps.length} done
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" aria-hidden /> Done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" aria-hidden /> Needed to go live
        </span>
      </div>
    </nav>
  );
}
