"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { useGetMeQuery } from "@/store/api/auth.api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/slices/auth.slice";

/** Wraps pages that need a logged-in admin. Sends guests to /login. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token, user, isHydrated } = useAppSelector((state) => state.auth);
  const { data, isError, refetch } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (isHydrated && !token) router.replace("/login");
  }, [isHydrated, token, router]);

  useEffect(() => {
    if (data?.data) dispatch(setUser(data.data));
  }, [data, dispatch]);

  // Server unreachable (a 401 logs the user out instead, see base-api.ts)
  if (isError && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-sm text-gray-600">
        <p>We could not reach the server.</p>
        <button onClick={() => refetch()} className="font-medium text-brand-700 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!isHydrated || !token || !user) return <FullPageLoader />;
  return <>{children}</>;
}

/** Wraps login / signup pages. Sends logged-in admins to the dashboard. */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isHydrated && token) router.replace("/dashboard");
  }, [isHydrated, token, router]);

  if (!isHydrated || token) return <FullPageLoader />;
  return <>{children}</>;
}
