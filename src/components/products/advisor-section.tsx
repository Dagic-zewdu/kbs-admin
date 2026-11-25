"use client";

import { Lightbulb, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdvisorOptions, AdvisorProfile, Option } from "@/types/advisor";
import { ChoiceChips } from "./choice-chips";

const inputClasses =
  "h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:h-10";

/** Names of the parts the completeness counts, as in the API */
const partLabels: Record<string, string> = {
  purposes: "what it does",
  concerns: "concerns it helps",
  goodFor: "good for",
  whenToUse: "when to use",
  keyIngredients: "key ingredients",
  strength: "strength",
  texture: "texture",
  summary: "summary",
  ingredients: "ingredient list",
};

/** The same parts as the API counts, so the bar moves while filling in */
const missingParts = (profile: AdvisorProfile, hasIngredients: boolean) => {
  const parts: Record<string, boolean> = {
    purposes: profile.purposes.length > 0,
    concerns: profile.concerns.length > 0,
    goodFor: profile.goodForSkin.length + profile.goodForHair.length > 0,
    whenToUse: Boolean(profile.routineStep && profile.timeOfDay && profile.frequency),
    keyIngredients: profile.keyIngredients.some((item) => item.name.trim()),
    strength: Boolean(profile.strength),
    texture: Boolean(profile.texture),
    summary: Boolean(profile.summary?.trim()),
    ingredients: hasIngredients,
  };
  return { missing: Object.keys(parts).filter((part) => !parts[part]), total: Object.keys(parts).length };
};
const neededToRecommend = ["purposes", "concerns", "goodFor", "whenToUse", "ingredients"];

function Select({ label, options, value, onChange }: { label: string; options: Option[]; value: string | null; onChange: (value: string | null) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value || null)} className={`${inputClasses} w-full`}>
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface AdvisorSectionProps {
  options: AdvisorOptions;
  value: AdvisorProfile;
  hasIngredients: boolean;
  onChange: (change: Partial<AdvisorProfile>) => void;
}

/** The optional advisor profile */
export function AdvisorSection({ options, value, hasIngredients, onChange }: AdvisorSectionProps) {
  const { missing, total } = missingParts(value, hasIngredients);
  const percent = Math.round(((total - missing.length) / total) * 100);
  const stillNeeded = missing.filter((part) => neededToRecommend.includes(part));

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3 sm:p-4">
        <p className="flex gap-2 text-sm text-gray-800">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
          Optional. Products with these details can be recommended by the AI beauty advisor and are easier to find in search and filters.
        </p>
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Advisor details filled in"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 flex-1 overflow-hidden rounded-full bg-white"
          >
            <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">{percent}%</span>
        </div>
        <p className="text-xs text-gray-600">
          {stillNeeded.length > 0
            ? `To be recommended it still needs: ${stillNeeded.map((part) => partLabels[part]).join(", ")}.`
            : missing.length > 0
              ? `The advisor can recommend it. Even better with: ${missing.map((part) => partLabels[part]).join(", ")}.`
              : "Complete. The advisor can recommend it."}
        </p>
      </div>

      <ChoiceChips label="What it does" hint="Up to 3" max={3} options={options.purposes} value={value.purposes} onChange={(purposes) => onChange({ purposes })} />
      <ChoiceChips label="Concerns it helps" options={options.concerns} value={value.concerns} onChange={(concerns) => onChange({ concerns })} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ChoiceChips
            label="Good for: skin"
            options={options.skinTypes}
            value={value.goodForSkin}
            disabled={value.notForSkin}
            onChange={(goodForSkin) => onChange({ goodForSkin })}
          />
          <ChoiceChips
            label="Good for: hair"
            options={options.hairTypes}
            value={value.goodForHair}
            disabled={value.notForHair}
            onChange={(goodForHair) => onChange({ goodForHair })}
          />
        </div>
        <div className="space-y-4">
          <ChoiceChips
            label="Not for: skin"
            options={options.skinTypes}
            value={value.notForSkin}
            disabled={value.goodForSkin}
            onChange={(notForSkin) => onChange({ notForSkin })}
          />
          <ChoiceChips
            label="Not for: hair"
            options={options.hairTypes}
            value={value.notForHair}
            disabled={value.goodForHair}
            onChange={(notForHair) => onChange({ notForHair })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Routine step" options={options.routineSteps} value={value.routineStep} onChange={(routineStep) => onChange({ routineStep })} />
        <Select label="When" options={options.timesOfDay} value={value.timeOfDay} onChange={(timeOfDay) => onChange({ timeOfDay })} />
        <Select label="How often" options={options.frequencies} value={value.frequency} onChange={(frequency) => onChange({ frequency })} />
        <Select label="Strength" options={options.strengths} value={value.strength} onChange={(strength) => onChange({ strength })} />
        <Select label="Texture" options={options.textures} value={value.texture} onChange={(texture) => onChange({ texture })} />
        <Select label="Feel" options={options.feels} value={value.feel} onChange={(feel) => onChange({ feel })} />
      </div>

      <KeyIngredients value={value} onChange={onChange} />

      <ChoiceChips
        label="Cautions"
        hint="Others are added automatically from the ingredients"
        options={options.cautions}
        value={value.cautions}
        onChange={(cautions) => onChange({ cautions })}
      />

      <Textarea
        label="Summary for the advisor"
        rows={3}
        maxLength={600}
        value={value.summary ?? ""}
        onChange={(event) => onChange({ summary: event.target.value })}
        placeholder="Gentle low-pH gel cleanser for oily and combination skin, morning and night."
      />
      <Keywords value={value.keywords} onChange={(keywords) => onChange({ keywords })} />
    </div>
  );
}

function KeyIngredients({ value, onChange }: { value: AdvisorProfile; onChange: (change: Partial<AdvisorProfile>) => void }) {
  const rows = value.keyIngredients;
  const set = (keyIngredients: AdvisorProfile["keyIngredients"]) => onChange({ keyIngredients });

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">Key ingredients</legend>
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <input
            aria-label={`Key ingredient ${index + 1}`}
            value={row.name}
            maxLength={100}
            placeholder="Niacinamide"
            onChange={(event) => set(rows.map((item, position) => (position === index ? { ...item, name: event.target.value } : item)))}
            className={`${inputClasses} min-w-0 flex-1`}
          />
          <PercentInput
            label={`Percent of key ingredient ${index + 1}`}
            value={row.percent}
            onChange={(percent) => set(rows.map((item, position) => (position === index ? { ...item, percent } : item)))}
          />
          <button
            type="button"
            aria-label={`Remove key ingredient ${index + 1}`}
            onClick={() => set(rows.filter((_, position) => position !== index))}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 sm:size-10"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => set([...rows, { name: "", percent: null }])} disabled={rows.length >= 10}>
        <Plus className="size-4" aria-hidden /> Add key ingredient
      </Button>
    </fieldset>
  );
}

/** Keeps what is typed ("0." on the way to "0.5") */
function PercentInput({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  return (
    <span className="relative w-24 shrink-0">
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        placeholder="5"
        onChange={(event) => {
          const next = event.target.value.replace(",", ".").replace(/[^\d.]/g, "");
          setText(next);
          onChange(Number(next) > 0 ? Number(next) : null);
        }}
        className={`${inputClasses} w-full pr-7`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">%</span>
    </span>
  );
}

function Keywords({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const words = text
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word.length >= 2 && !value.some((item) => item.toLowerCase() === word.toLowerCase()));
    if (words.length) onChange([...value, ...words].slice(0, 20));
    setText("");
  };

  return (
    <div className="space-y-2">
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-gray-700">
          Search words <span className="font-normal text-gray-500">Press Enter after each</span>
        </span>
        <input
          value={text}
          maxLength={200}
          onChange={(event) => setText(event.target.value)}
          onBlur={add}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault(); // never submits the form
              add();
            }
          }}
          placeholder="face wash, oily skin"
          className={`${inputClasses} w-full`}
        />
      </label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((word) => (
            <li key={word} className="flex items-center gap-1 rounded-full bg-gray-100 pl-3 text-sm text-gray-700">
              {word}
              <button
                type="button"
                aria-label={`Remove ${word}`}
                onClick={() => onChange(value.filter((item) => item !== word))}
                className="flex size-8 items-center justify-center rounded-full hover:text-red-700"
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
