"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateDelivererMutation, useUpdateDelivererMutation } from "@/store/api/deliverers.api";
import type { Deliverer } from "@/types/deliverer";
import { DelivererFields, delivererProblem, emptyDelivererForm, toDelivererForm, toDelivererInput, type DelivererForm } from "./deliverer-fields";

/** Create a deliverer, or edit one */
export function DelivererEditor({ deliverer }: { deliverer?: Deliverer }) {
  const router = useRouter();
  const [form, setForm] = useState<DelivererForm>(() => (deliverer ? toDelivererForm(deliverer) : emptyDelivererForm()));
  const [localError, setLocalError] = useState("");
  const [create, createState] = useCreateDelivererMutation();
  const [update, updateState] = useUpdateDelivererMutation();
  const isSaving = createState.isLoading || updateState.isLoading;
  const error = createState.error || updateState.error;

  const save = async () => {
    const problem = delivererProblem(form);
    if (problem) return setLocalError(problem);
    setLocalError("");
    const input = toDelivererInput(form);
    const result = deliverer ? await update({ id: deliverer.id, ...input }) : await create(input);
    if (result.data) router.replace(`/deliverers/${result.data.data.id}?saved=1`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={deliverer ? `Edit ${deliverer.name}` : "Add deliverer"}
        description={deliverer ? undefined : "A person or a delivery company that brings sales to customers. Only your company sees them."}
        backHref={deliverer ? `/deliverers/${deliverer.id}` : "/deliverers"}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
      >
        <DelivererFields
          value={form}
          onChange={(change) => {
            setForm((current) => ({ ...current, ...change }));
            setLocalError("");
          }}
        />
        {(localError || error) && <Alert>{localError || getErrorMessage(error)}</Alert>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {deliverer ? "Save changes" : "Add deliverer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
