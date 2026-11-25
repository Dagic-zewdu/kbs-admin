"use client";

import { Lightbulb, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdvisorOptions, AdvisorProfile, CustomerQuestion, Option } from "@/types/advisor";
import { ChoiceChips } from "./choice-chips";
import { PhraseList } from "./phrase-list";

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
  bodyAreas: "where it is used",
  ageGroups: "age groups",
  keyBenefits: "key benefits (Description step)",
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
    bodyAreas: profile.bodyAreas.length > 0,
    ageGroups: profile.ageGroups.length > 0,
    keyBenefits: profile.keyBenefits.length > 0,
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

      <Group title="What it does">
        <ChoiceChips label="What it does" hint="Up to 3" max={3} options={options.purposes} value={value.purposes} onChange={(purposes) => onChange({ purposes })} />
        <ChoiceChips label="Concerns it helps" options={options.concerns} value={value.concerns} onChange={(concerns) => onChange({ concerns })} />
        <ChoiceChips label="Used on" options={options.bodyAreas} value={value.bodyAreas} onChange={(bodyAreas) => onChange({ bodyAreas })} />
        <KeyIngredients value={value} onChange={onChange} />
      </Group>

      <Group title="Who it is for">
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
        <ChoiceChips label="Age groups" options={options.ageGroups} value={value.ageGroups} onChange={(ageGroups) => onChange({ ageGroups })} />
        <ChoiceChips label="Skin tones" hint="For makeup and sunscreen" options={options.skinTones} value={value.skinTones} onChange={(skinTones) => onChange({ skinTones })} />
        <ChoiceChips label="Undertones" hint="For makeup" options={options.undertones} value={value.undertones} onChange={(undertones) => onChange({ undertones })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Made for" options={options.madeFor} value={value.madeFor} onChange={(madeFor) => onChange({ madeFor })} />
          <Select label="Experience needed" options={options.experiences} value={value.experience} onChange={(experience) => onChange({ experience })} />
        </div>
      </Group>

      <Group title="How it is used">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Routine step" options={options.routineSteps} value={value.routineStep} onChange={(routineStep) => onChange({ routineStep })} />
          <Select label="When" options={options.timesOfDay} value={value.timeOfDay} onChange={(timeOfDay) => onChange({ timeOfDay })} />
          <Select label="How often" options={options.frequencies} value={value.frequency} onChange={(frequency) => onChange({ frequency })} />
          <Select label="Results after" options={options.resultsAfter} value={value.resultsAfter} onChange={(resultsAfter) => onChange({ resultsAfter })} />
        </div>
        <ChoiceChips label="Best weather" options={options.weather} value={value.weather} onChange={(weather) => onChange({ weather })} />
      </Group>

      <Group title="How it feels">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Strength" options={options.strengths} value={value.strength} onChange={(strength) => onChange({ strength })} />
          <Select label="Texture" options={options.textures} value={value.texture} onChange={(texture) => onChange({ texture })} />
          <Select label="Feel" options={options.feels} value={value.feel} onChange={(feel) => onChange({ feel })} />
          <Select label="Scent" options={options.scents} value={value.scent} onChange={(scent) => onChange({ scent })} />
          <Select label="Finish (makeup)" options={options.finishes} value={value.finish} onChange={(finish) => onChange({ finish })} />
          <Select label="Coverage (makeup)" options={options.coverages} value={value.coverage} onChange={(coverage) => onChange({ coverage })} />
        </div>
      </Group>

      <Group title="Safety">
        <ChoiceChips
          label="Cautions"
          hint="Others are added automatically from the ingredients"
          options={options.cautions}
          value={value.cautions}
          onChange={(cautions) => onChange({ cautions })}
        />
      </Group>

      <Group title="For the AI">
        <Textarea
          label="Summary for the advisor"
          rows={3}
          maxLength={600}
          value={value.summary ?? ""}
          onChange={(event) => onChange({ summary: event.target.value })}
          placeholder="Gentle low-pH gel cleanser for oily and combination skin, morning and night."
        />
        <CustomerQuestions value={value.customerQuestions} onChange={(customerQuestions) => onChange({ customerQuestions })} />
        <PhraseList
          label="Search words"
          placeholder="face wash, oily skin"
          value={value.keywords}
          onChange={(keywords) => onChange({ keywords })}
          max={20}
          maxLength={40}
          splitOnComma
        />
      </Group>
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

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function CustomerQuestions({ value, onChange }: { value: CustomerQuestion[]; onChange: (value: CustomerQuestion[]) => void }) {
  const set = (index: number, change: Partial<CustomerQuestion>) => onChange(value.map((item, position) => (position === index ? { ...item, ...change } : item)));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-gray-700">
        Questions customers ask <span className="font-normal text-gray-500">The AI answers with your words</span>
      </legend>
      {value.map((item, index) => (
        <div key={index} className="flex gap-2 rounded-lg border border-gray-200 p-3">
          <div className="min-w-0 flex-1 space-y-2">
            <input
              aria-label={`Question ${index + 1}`}
              value={item.question}
              maxLength={200}
              placeholder="Can I use it every day?"
              onChange={(event) => set(index, { question: event.target.value })}
              className={`${inputClasses} w-full`}
            />
            <textarea
              aria-label={`Answer ${index + 1}`}
              rows={2}
              value={item.answer}
              maxLength={600}
              placeholder="Yes, morning and night."
              onChange={(event) => set(index, { answer: event.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            type="button"
            aria-label={`Remove question ${index + 1}`}
            onClick={() => onChange(value.filter((_, position) => position !== index))}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 sm:size-10"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...value, { question: "", answer: "" }])} disabled={value.length >= 10}>
        <Plus className="size-4" aria-hidden /> Add question
      </Button>
    </fieldset>
  );
}
