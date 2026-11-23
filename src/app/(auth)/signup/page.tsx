"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { getRememberedCompany } from "@/lib/brand-theme";
import { useSignupMutation } from "@/store/api/auth.api";
import { signupSchema, type SignupValues } from "@/validations/auth";

export default function SignupPage() {
  const [signup, { isLoading, error }] = useSignupMutation();
  const [pendingMessage, setPendingMessage] = useState("");
  const { register, handleSubmit, formState, setValue } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });
  const companyFromUrl = useSearchParams().get("company");

  // Fill in the company code from the link (?company=) or the last company used on this device
  useEffect(() => {
    const code = companyFromUrl || getRememberedCompany()?.slug;
    if (code) setValue("companySlug", code);
  }, [companyFromUrl, setValue]);

  const onSubmit = async ({ companySlug, firstName, lastName, email, password }: SignupValues) => {
    const response = await signup({ companySlug, firstName, lastName, email, password }).unwrap().catch(() => null);
    if (!response) return;

    // New admin accounts are inactive until a super admin activates them
    setPendingMessage(response.message);
  };

  if (pendingMessage) {
    return (
      <div className="space-y-6">
        <Alert type="success">{pendingMessage}</Alert>
        <Link href="/login" className="block text-center text-sm font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const { errors } = formState;

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500">Ask your company for its code. You can sign in once your company&apos;s super admin activates you.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        <Input
          label="Company code"
          placeholder="e.g. kbs-cosmetics"
          autoComplete="organization"
          autoCapitalize="none"
          error={errors.companySlug?.message}
          {...register("companySlug")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <Input label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create account
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm text-gray-500">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
        <p>
          Your company isn&apos;t on E-commerce Cosmetics yet?{" "}
          <Link href="/register-company" className="font-medium text-brand-700 hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </>
  );
}
