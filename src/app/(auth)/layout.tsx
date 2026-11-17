import { GuestGuard } from "@/components/auth/auth-guard";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <main className="flex min-h-screen">
        {/* Brand panel, hidden on small screens */}
        <section className="hidden w-1/2 flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
          <Logo tone="light" />
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">Manage your beauty store in one place.</h2>
            <p className="max-w-md text-brand-100">
              Products, orders, customers and inventory for KBS Cosmetics.
            </p>
          </div>
          <p className="text-xs text-brand-200">© KBS Cosmetics</p>
        </section>

        <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
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
