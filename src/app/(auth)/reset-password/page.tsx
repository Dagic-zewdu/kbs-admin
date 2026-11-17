"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useResetPasswordMutation } from "@/store/api/auth.api";
import { resetPasswordSchema, type ResetPasswordValues } from "@/validations/auth";

export default function ResetPasswordPage() {
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const [isDone, setIsDone] = useState(false);
  const { register, handleSubmit, formState, setValue } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Pre-fill the email typed on the forgot password page
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("kbs_reset_email");
    if (savedEmail) setValue("email", savedEmail);
  }, [setValue]);

  const onSubmit = async ({ email, code, password }: ResetPasswordValues) => {
    const response = await resetPassword({ email, code, password }).unwrap().catch(() => null);
    if (!response) return;
    sessionStorage.removeItem("kbs_reset_email");
    setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="space-y-6">
        <Alert type="success">Your password has been updated.</Alert>
        <Link
          href="/login"
          className="flex h-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { errors } = formState;

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Set a new password</h1>
        <p className="text-sm text-gray-500">Enter the code we emailed you and choose a new password.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="Reset code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          error={errors.code?.message}
          {...register("code")}
        />
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

      <p className="text-center text-sm text-gray-500">
        Didn&apos;t get a code?{" "}
        <Link href="/forgot-password" className="font-medium text-brand-700 hover:underline">
          Send again
        </Link>
      </p>
    </>
  );
}
