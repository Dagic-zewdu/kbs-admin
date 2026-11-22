import { Suspense } from "react";
import { GuestGuard } from "@/components/auth/auth-guard";
import { AuthShell } from "@/components/branding/auth-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      {/* AuthShell reads ?company= from the URL */}
      <Suspense>
        <AuthShell>{children}</AuthShell>
      </Suspense>
    </GuestGuard>
  );
}
