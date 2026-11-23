"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useResetPasswordMutation } from "@/store/api/auth.api";
import { resetPasswordSchema, type ResetPasswordValues } from "@/validations/auth";

const loginHrefFor = (company: string | null) => (company ? `/login?company=${encodeURIComponent(company)}` : "/login");
const linkClass = "flex h-11 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700 sm:h-10";

/** Step 2: opened from the emailed link (?token=…). Only asks for the new password. */
function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const loginHref = loginHrefFor(params.get("company"));
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [isDone, setIsDone] = useState(false);
  const { register, handleSubmit, formState } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <LinkIcon className="mx-auto size-10 text-gray-400" aria-hidden />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Open the link from your email</h1>
          <p className="text-sm text-gray-500">To reset your password, ask for a reset link and open it from your email.</p>
        </div>
        <Link href="/forgot-password" className={linkClass}>
          Get a reset link
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-6">
        <Alert type="success">Your password has been updated. Sign in with your new password.</Alert>
        <Link href={loginHref} className={linkClass}>
          Sign in
        </Link>
      </div>
    );
  }

  const onSubmit = async ({ password }: ResetPasswordValues) => {
    const response = await resetPassword({ token, password }).unwrap().catch(() => null);
    if (response) setIsDone(true);
  };

  const { errors } = formState;
  const isLinkInvalid = (error as { data?: { code?: string } } | undefined)?.data?.code === "INVALID_RESET_LINK";

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Choose a new password</h1>
        <p className="text-sm text-gray-500">At least 8 characters, with a letter and a number.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        {isLinkInvalid && (
          <Link href="/forgot-password" className="block text-sm font-medium text-brand-700 hover:underline">
            Get a new reset link →
          </Link>
        )}
        <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
