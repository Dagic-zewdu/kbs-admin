"use client";

import { AlertTriangle } from "lucide-react";
import { ChoiceChips } from "./choice-chips";
import { PhraseList } from "./phrase-list";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/api-error";
import { usePreviewIngredientsQuery } from "@/store/api/products.api";
import type { AdvisorOptions } from "@/types/advisor";

interface IngredientsSectionProps {
  options: AdvisorOptions;
  text: string;
  claims: string[];
  monthsAfterOpening: string;
  worksWith: string[];
  avoidWith: string[];
  onAdvisorChange: (change: { worksWith?: string[]; avoidWith?: string[] }) => void;
  onChange: (change: { ingredientsText?: string; claims?: string[]; monthsAfterOpening?: string }) => void;
}

/** The list from the package, with what it means shown while typing */
export function IngredientsSection({ options, text, claims, monthsAfterOpening, worksWith, avoidWith, onAdvisorChange, onChange }: IngredientsSectionProps) {
  const typed = useDebouncedValue(text, 600);
  const preview = usePreviewIngredientsQuery({ text: typed, claims }, { skip: !typed.trim() });
  const result = typed.trim() && typed === text ? preview.data?.data : undefined;
  const cautionLabel = (value: string) => options.cautions.find((option) => option.value === value)?.label ?? value;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Textarea
          label="Ingredient list (optional)"
          rows={4}
          maxLength={10000}
          value={text}
          onChange={(event) => onChange({ ingredientsText: event.target.value })}
          placeholder="Water, Glycerin, Niacinamide (5%), Sodium Hyaluronate"
        />
        <p className="text-xs text-gray-500">Copy it from the package, in the same order, separated by commas.</p>
        {preview.error && typed.trim() && <p className="text-sm text-red-600">{getErrorMessage(preview.error)}</p>}
      </div>

      {result && (
        <div className="space-y-3 rounded-lg bg-gray-50 p-3 sm:p-4">
          <p className="text-sm font-medium text-gray-900">
            {result.ingredients.length} ingredient{result.ingredients.length === 1 ? "" : "s"}
          </p>
          <ol className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
            {result.ingredients.map((ingredient, index) => (
              <li
                key={index}
                className={`break-words rounded-md border px-2 py-1 text-xs ${
                  ingredient.types.length ? "border-amber-300 bg-amber-50 text-amber-900" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {ingredient.name}
                {ingredient.percent !== null && ` ${ingredient.percent}%`}
                {ingredient.types.length > 0 && <strong className="ml-1 font-semibold">· {ingredient.types.map((type) => type.label).join(", ")}</strong>}
              </li>
            ))}
          </ol>

          {result.analysis.claimConflicts.map((conflict) => (
            <p key={`${conflict.claim}-${conflict.ingredients[0]}`} className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                “{conflict.label}” is chosen, but the list contains {conflict.ingredients.join(", ")}.
              </span>
            </p>
          ))}

          {(result.analysis.warnings.length > 0 || result.analysis.cautions.length > 0 || result.analysis.dontCombineWith.length > 0) && (
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900">Added automatically from the ingredients</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {result.analysis.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
                {result.analysis.cautions.map((caution) => (
                  <li key={caution}>{cautionLabel(caution)}</li>
                ))}
                {result.analysis.dontCombineWith.length > 0 && (
                  <li>Not in the same routine as: {result.analysis.dontCombineWith.map((item) => item.label).join(", ")}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <ChoiceChips label="Claims" hint="Only what the package says" options={options.claims} value={claims} onChange={(value) => onChange({ claims: value })} />
      <div className="grid gap-4 md:grid-cols-2">
        <PhraseList
          label="Works well with"
          placeholder="Hyaluronic acid"
          value={worksWith}
          onChange={(value) => onAdvisorChange({ worksWith: value })}
          max={15}
          maxLength={80}
          splitOnComma
        />
        <PhraseList
          label="Don't use with"
          placeholder="Retinol"
          value={avoidWith}
          onChange={(value) => onAdvisorChange({ avoidWith: value })}
          max={15}
          maxLength={80}
          splitOnComma
        />
      </div>
      <div className="sm:w-64">
        <Input
          label="Months after opening (optional)"
          inputMode="numeric"
          value={monthsAfterOpening}
          onChange={(event) => onChange({ monthsAfterOpening: event.target.value.replace(/\D/g, "").slice(0, 2) })}
          placeholder="12"
        />
        <p className="mt-1 text-xs text-gray-500">The open-jar symbol: 6M, 12M, 24M</p>
      </div>
    </div>
  );
}
