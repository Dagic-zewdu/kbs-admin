"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useForgotPasswordMutation } from "@/store/api/auth.api";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/validations/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const { register, handleSubmit, formState } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    const response = await forgotPassword(values).unwrap().catch(() => null);
    if (!response) return;
    // Remember the email so the reset form is pre-filled
    sessionStorage.setItem("kbs_reset_email", values.email);
    router.push("/reset-password");
  };

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot your password?</h1>
        <p className="text-sm text-gray-500">Enter your email and we will send you a 6 digit reset code.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send reset code
        </Button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </>
  );
}
