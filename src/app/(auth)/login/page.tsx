"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useLoginMutation } from "@/store/api/auth.api";
import { useAppDispatch } from "@/store/hooks";
import { loggedIn } from "@/store/slices/auth.slice";
import { loginSchema, type LoginValues } from "@/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  // Keep ?company= when moving to sign-up so the company code is filled in
  const company = useSearchParams().get("company");
  const companyQuery = company ? `?company=${encodeURIComponent(company)}` : "";
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    const response = await login(values).unwrap().catch(() => null);
    if (!response) return; // the error is shown from `error`

    dispatch(loggedIn({ token: response.data.token, user: response.data.user }));
    router.replace("/dashboard");
  };

  return (
    <>
      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500">Sign in to your company&apos;s admin site.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
        <Input label="Email" isRequired type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <Input
          label="Password" isRequired
          type="password"
          autoComplete="current-password"
          error={formState.errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        New to the team?{" "}
        <Link href={`/signup${companyQuery}`} className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
        <br />
        New business?{" "}
        <Link href="/register-company" className="font-medium text-brand-700 hover:underline">
          Register your company
        </Link>
      </p>
    </>
  );
}
