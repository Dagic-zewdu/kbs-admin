"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getErrorMessage } from "@/lib/api-error";
import { useCreateSupplierMutation, useUpdateSupplierMutation } from "@/store/api/suppliers.api";
import type { Supplier } from "@/types/supplier";
import { emptySupplierForm, SupplierFields, supplierProblem, toSupplierForm, toSupplierInput, type SupplierForm } from "./supplier-fields";

/** Create a supplier, or edit one of ours */
export function SupplierEditor({ supplier }: { supplier?: Supplier }) {
  const router = useRouter();
  const [form, setForm] = useState<SupplierForm>(() => (supplier ? toSupplierForm(supplier) : emptySupplierForm()));
  const [localError, setLocalError] = useState("");
  const [create, createState] = useCreateSupplierMutation();
  const [update, updateState] = useUpdateSupplierMutation();
  const isSaving = createState.isLoading || updateState.isLoading;
  const error = createState.error || updateState.error;

  const save = async () => {
    const problem = supplierProblem(form);
    if (problem) return setLocalError(problem);
    setLocalError("");
    const input = toSupplierInput(form);
    const result = supplier ? await update({ id: supplier.id, ...input }) : await create(input);
    if (result.data) router.replace(`/suppliers/${result.data.data.id}?saved=1`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={supplier ? `Edit ${supplier.name}` : "Add supplier"}
        description={supplier ? undefined : "Private unless you share it. What you pay them is always private."}
        backHref={supplier ? `/suppliers/${supplier.id}` : "/suppliers"}
      />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
      >
        <SupplierFields
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
            {supplier ? "Save changes" : "Add supplier"}
          </Button>
        </div>
      </form>
    </div>
  );
}
