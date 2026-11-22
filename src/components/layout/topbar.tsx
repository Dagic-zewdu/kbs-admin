"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { env } from "@/config/env";
import { roleLabels } from "@/lib/labels";
import { baseApi } from "@/store/api/base-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/slices/auth.slice";
import { toggleSidebar } from "@/store/slices/ui.slice";

export function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isMenuOpen = useAppSelector((state) => state.ui.isSidebarOpen);

  const logout = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState()); // forget cached data of the previous user
    router.replace("/login");
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 pt-safe backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls="main-sidebar"
        >
          <Menu className="size-5" />
        </button>

        {/* The sidebar (with the logo) is hidden on phones, so show the logo here */}
        <div className="min-w-0 lg:hidden">
          <Logo compact name={user?.company?.name} logoUrl={user?.company?.logoUrl} />
        </div>

        {env.appEnv !== "prod" && (
          <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700 sm:px-2.5 sm:py-1 sm:text-xs">
            {env.appEnv}
            <span className="hidden sm:inline"> environment</span>
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user ? roleLabels[user.role] : ""}</p>
          </div>
          <span
            className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
            title={user ? `${user.firstName} ${user.lastName} · ${roleLabels[user.role]}` : undefined}
          >
            {initials || "?"}
          </span>
          <button
            onClick={logout}
            className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
