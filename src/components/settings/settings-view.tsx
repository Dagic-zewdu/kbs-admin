"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { formatPrice } from "@/lib/labels";
import { decimalText } from "@/lib/numbers";
import { customerPrice, vatOf } from "@/lib/pricing";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settings.api";
import { useAppSelector } from "@/store/hooks";
import type { CompanySettings } from "@/types/settings";

const EXAMPLE_PRICE = 1000;

/** Settings of the company. Super admins change them, admins can look. */
export function SettingsView() {
  const { data, isLoading, error } = useGetSettingsQuery();
  const canEdit = useAppSelector((state) => state.auth.user?.role === "super_admin");
  if (isLoading) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-brand-600" aria-label="Loading" />;
  if (!data) return <p className="py-16 text-center text-sm text-red-600">{getErrorMessage(error)}</p>;
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Settings" description="For your company only." />
      <VatSettings saved={data.data} canEdit={canEdit} />
    </div>
  );
}

function VatSettings({ saved, canEdit }: { saved: CompanySettings; canEdit: boolean }) {
  const [vatEnabled, setVatEnabled] = useState(saved.vatEnabled);
  const [rateText, setRateText] = useState(String(saved.vatRate));
  const [localError, setLocalError] = useState("");
  const [notice, setNotice] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [update, { isLoading, error, reset }] = useUpdateSettingsMutation();
  const vatRate = Number(rateText);
  const typed: CompanySettings = { vatEnabled, vatRate };
  const isRateValid = vatRate > 0 && vatRate <= 50;
  const isChanged = vatEnabled !== saved.vatEnabled || vatRate !== saved.vatRate;
  // Only these change what customers pay
  const changesPrices = vatEnabled !== saved.vatEnabled || (vatEnabled && vatRate !== saved.vatRate);

  const change = (apply: () => void) => {
    apply();
    setNotice("");
    setLocalError("");
    reset();
  };

  const save = async () => {
    const result = await update(typed);
    setIsConfirming(false);
    if (result.data) setNotice("Saved.");
  };

  const submit = () => {
    if (!isRateValid) return setLocalError("The VAT rate is more than 0 and at most 50.");
    if (changesPrices) setIsConfirming(true);
    else save();
  };

  return (
    <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900">VAT</h2>
          <p className="mt-0.5 text-sm text-gray-500">When it&apos;s on, VAT is added on top of every selling price. Customers see the price with VAT.</p>
        </div>
        {!canEdit && <p className="text-sm text-gray-600">Only a super admin can change this.</p>}
        {(localError || error) && <Alert>{localError || getErrorMessage(error)}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        <fieldset disabled={!canEdit || isLoading} className="space-y-4">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-sm font-medium text-gray-900">Add VAT to selling prices</span>
            <input
              type="checkbox"
              role="switch"
              checked={vatEnabled}
              onChange={(event) => change(() => {
                  setVatEnabled(event.target.checked);
                  // Its field is hidden when off, so nothing wrong stays in it
                  if (!event.target.checked) setRateText(String(saved.vatRate));
                })}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 peer-disabled:opacity-50"
            />
          </label>
          {vatEnabled && (
            <>
              <div className="max-w-40">
                <Input
                  label="VAT rate, %"
                  inputMode="decimal"
                  maxLength={5}
                  value={rateText}
                  onChange={(event) => change(() => setRateText(decimalText(event.target.value)))}
                />
              </div>
              {isRateValid && (
                <p className="text-sm text-gray-600">
                  Example: selling price {formatPrice(EXAMPLE_PRICE)} + VAT {formatPrice(vatOf(EXAMPLE_PRICE, typed))} ={" "}
                  <strong className="font-semibold text-gray-900">customer pays {formatPrice(customerPrice(EXAMPLE_PRICE, typed))}</strong>
                </p>
              )}
            </>
          )}
          {canEdit && (
            <Button type="submit" isLoading={isLoading} disabled={!isChanged}>
              Save
            </Button>
          )}
        </fieldset>
      </form>
      <ConfirmDialog
        open={isConfirming}
        title={vatEnabled ? `Add ${vatRate}% VAT to your prices?` : "Stop adding VAT?"}
        description={
          vatEnabled
            ? "Every price your customers see in the shop changes right away. Your selling prices stay the same."
            : "Customers will pay your selling prices without VAT, right away."
        }
        confirmLabel={vatEnabled ? "Add VAT" : "Stop VAT"}
        isLoading={isLoading}
        onConfirm={save}
        onCancel={() => setIsConfirming(false)}
      />
    </section>
  );
}
