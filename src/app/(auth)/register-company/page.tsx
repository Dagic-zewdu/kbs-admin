"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useRequestCompanyMutation, type CompanyRequestBody } from "@/store/api/auth.api";
import { companyRequestSchema, type CompanyRequestValues } from "@/validations/company-request";

/** Leaves out empty optional fields so the API gets only what was filled in */
const withoutEmpty = (values: CompanyRequestValues) =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "" && value !== undefined)) as unknown as CompanyRequestBody;

const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

export default function RegisterCompanyPage() {
  const [requestCompany, { isLoading, error }] = useRequestCompanyMutation();
  const [sentFor, setSentFor] = useState<{ company: string; email: string } | null>(null);
  const { register, handleSubmit, formState } = useForm<CompanyRequestValues>({ resolver: zodResolver(companyRequestSchema) });

  const onSubmit = async (values: CompanyRequestValues) => {
    const response = await requestCompany(withoutEmpty(values)).unwrap().catch(() => null);
    if (response) setSentFor({ company: response.data.companyName, email: values.contactEmail });
  };

  if (sentFor) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-green-600" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Request sent</h1>
          <p className="text-sm text-gray-500">
            We received your request for <span className="font-medium text-gray-900">{sentFor.company}</span>. Our team will review it
            and contact you at <span className="font-medium text-gray-900">{sentFor.email}</span>. Once it&apos;s approved you&apos;ll get
            your super admin sign-in details.
          </p>
        </div>
        <Link href="/login" className="block text-sm font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const { errors } = formState;

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Register your company</h1>
        <p className="text-sm text-gray-500">
          Sell on E-commerce Cosmetics. Tell us about your business; once we approve it, you&apos;ll be its super admin.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Company</legend>
          <Input label="Company name" autoComplete="organization" error={errors.companyName?.message} {...register("companyName")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Phone" type="tel" placeholder="+251 9..." error={errors.phone?.message} {...register("phone")} />
            <Input label="Second phone (optional)" type="tel" error={errors.secondaryPhone?.message} {...register("secondaryPhone")} />
          </div>
          <Input label="Company email (optional)" type="email" error={errors.email?.message} {...register("email")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="City (optional)" placeholder="Addis Ababa" error={errors.city?.message} {...register("city")} />
            <Input label="Address (optional)" error={errors.address?.message} {...register("address")} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              What do you sell? (optional)
            </label>
            <textarea id="description" rows={3} className={textareaClass} {...register("description")} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">You</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" autoComplete="given-name" error={errors.contactFirstName?.message} {...register("contactFirstName")} />
            <Input label="Last name" autoComplete="family-name" error={errors.contactLastName?.message} {...register("contactLastName")} />
          </div>
          <Input
            label="Your email"
            type="email"
            autoComplete="email"
            error={errors.contactEmail?.message}
            {...register("contactEmail")}
          />
          <Input label="Your phone (optional)" type="tel" autoComplete="tel" error={errors.contactPhone?.message} {...register("contactPhone")} />
          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message to our team (optional)
            </label>
            <textarea id="message" rows={3} className={textareaClass} {...register("message")} />
          </div>
        </fieldset>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send request
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Your company is already registered?{" "}
        <Link href="/signup" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
