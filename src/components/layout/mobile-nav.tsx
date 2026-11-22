"use client";

import clsx from "clsx";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/ui.slice";
import { isActivePath, mobileNavItems } from "./nav-items";

const itemClasses = "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors";

/** App-style bottom bar on phones and tablets. The full menu opens from "Menu". */
export function MobileNav() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isMenuOpen = useAppSelector((state) => state.ui.isSidebarOpen);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-safe backdrop-blur lg:hidden"
      aria-label="Quick navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(itemClasses, isActive ? "text-brand-700" : "text-gray-500 active:text-brand-700")}
            >
              <span className={clsx("flex h-7 w-12 items-center justify-center rounded-full", isActive && "bg-brand-50")}>
                <Icon className="size-5" aria-hidden />
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => dispatch(toggleSidebar())}
          aria-expanded={isMenuOpen}
          aria-controls="main-sidebar"
          className={clsx(itemClasses, isMenuOpen ? "text-brand-700" : "text-gray-500 active:text-brand-700")}
        >
          <span className={clsx("flex h-7 w-12 items-center justify-center rounded-full", isMenuOpen && "bg-brand-50")}>
            <Menu className="size-5" aria-hidden />
          </span>
          Menu
        </button>
      </div>
    </nav>
  );
}
