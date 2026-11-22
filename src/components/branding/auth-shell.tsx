"use client";

import { Logo } from "@/components/ui/logo";
import { useGuestBranding } from "./use-guest-branding";

/** Login / sign-up / password layout, in the company's colours when known */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const branding = useGuestBranding();
  const name = branding?.name;

  return (
    <main className="flex min-h-dvh pt-safe pb-safe">
      {/* Brand panel, hidden on small screens */}
      <section className="hidden w-1/2 flex-col justify-between bg-linear-to-br from-brand-500 via-brand-600 to-brand-800 p-12 text-white lg:flex">
        <Logo tone="light" name={name} logoUrl={branding?.logoUrl} />
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            {name ? `Run ${name} in one place.` : "Manage your beauty store in one place."}
          </h2>
          <p className="max-w-md text-brand-50">Products, orders, customers and inventory for your company on E-commerce Cosmetics.</p>
        </div>
        <p className="text-xs text-brand-100">© {name ?? "E-commerce Cosmetics"}</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo name={name} logoUrl={branding?.logoUrl} />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
