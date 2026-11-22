import { GuestGuard } from "@/components/auth/auth-guard";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <main className="flex min-h-dvh pt-safe pb-safe">
        {/* Brand panel, hidden on small screens */}
        <section className="hidden w-1/2 flex-col justify-between bg-linear-to-br from-brand-500 via-brand-600 to-brand-800 p-12 text-white lg:flex">
          <Logo tone="light" />
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">Manage your beauty store in one place.</h2>
            <p className="max-w-md text-brand-50">
              Products, orders, customers and inventory for KBS Cosmetics.
            </p>
          </div>
          <p className="text-xs text-brand-100">© KBS Cosmetics</p>
        </section>

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </section>
      </main>
    </GuestGuard>
  );
}
