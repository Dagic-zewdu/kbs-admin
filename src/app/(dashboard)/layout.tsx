import { AuthGuard } from "@/components/auth/auth-guard";
import { BrandThemeSync } from "@/components/branding/brand-theme-sync";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <BrandThemeSync />
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        {/* Bottom padding leaves room for the mobile bottom bar */}
        <main className="mx-auto max-w-7xl px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </AuthGuard>
  );
}
