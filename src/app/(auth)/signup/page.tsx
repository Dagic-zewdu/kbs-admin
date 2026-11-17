"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api-error";
import { useSignupMutation } from "@/store/api/auth.api";
import { useAppDispatch } from "@/store/hooks";
import { loggedIn } from "@/store/slices/auth.slice";
import { signupSchema, type SignupValues } from "@/validations/auth";

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signup, { isLoading, error }] = useSignupMutation();
  const [pendingMessage, setPendingMessage] = useState("");
  const { register, handleSubmit, formState } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async ({ firstName, lastName, email, password }: SignupValues) => {
    const response = await signup({ firstName, lastName, email, password }).unwrap().catch(() => null);
    if (!response) return;

    // The first admin is activated right away; others wait for approval
    if (response.data.token) {
      dispatch(loggedIn({ token: response.data.token, user: response.data.user }));
      router.replace("/dashboard");
    } else {
      setPendingMessage(response.message);
    }
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
        <p className="text-sm text-gray-500">New admin accounts are approved by a super admin.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Alert>{getErrorMessage(error)}</Alert>
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

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
