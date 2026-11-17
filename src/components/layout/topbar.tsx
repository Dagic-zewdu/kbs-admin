"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";
import { baseApi } from "@/store/api/base-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/slices/auth.slice";
import { toggleSidebar } from "@/store/slices/ui.slice";

const roleLabels = { super_admin: "Super admin", admin: "Admin", customer: "Customer" };

export function Topbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const logout = () => {
    dispatch(loggedOut());
    dispatch(baseApi.util.resetApiState()); // forget cached data of the previous user
    router.replace("/login");
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {env.appEnv !== "prod" && (
        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase text-brand-700">
          {env.appEnv} environment
        </span>
      )}

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500">{user ? roleLabels[user.role] : ""}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initials || "?"}
        </span>
        <button onClick={logout} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900" aria-label="Log out" title="Log out">
          <LogOut className="size-4.5" />
        </button>
      </div>
    </header>
  );
}
