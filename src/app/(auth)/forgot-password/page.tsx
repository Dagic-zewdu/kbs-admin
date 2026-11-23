"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useForgotPasswordMutation } from "@/store/api/auth.api";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/validations/auth";

/** Step 1: ask for the email. The reset itself only happens from the link in the email. */
export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const [sentTo, setSentTo] = useState("");
  const { register, handleSubmit, formState, getValues } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    const response = await forgotPassword(values).unwrap().catch(() => null);
    if (response) setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div className="space-y-6 text-center">
        <MailCheck className="mx-auto size-12 text-brand-600" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500">
            If an account exists for <span className="font-medium text-gray-900">{sentTo}</span>, we sent it a link to reset
            the password. The link works once and expires in 30 minutes.
          </p>
          <p className="text-xs text-gray-500">No email after a few minutes? Check your spam folder.</p>
        </div>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" isLoading={isLoading} onClick={() => onSubmit({ email: getValues("email") })}>
            Send the link again
          </Button>
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="size-4" aria-hidden /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot your password?</h1>
        <p className="text-sm text-gray-500">Enter your email and we&apos;ll send you a link to reset your password.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </>
  );
}
