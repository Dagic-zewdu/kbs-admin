"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeSidebar } from "@/store/slices/ui.slice";
import { isActivePath, navSections, type NavItem } from "./nav-items";

function NavLink({ item, isActive, onNavigate }: { item: NavItem; isActive: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  const classes = clsx(
    // Taller rows on phones so they are easy to tap
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors lg:py-2 lg:text-sm",
    isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700",
    item.comingSoon && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-gray-600",
  );

  if (item.comingSoon) {
    return (
      <span className={classes} aria-disabled>
        <Icon className="size-4.5" aria-hidden />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">Soon</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={classes} aria-current={isActive ? "page" : undefined} onClick={onNavigate}>
      <Icon className="size-4.5" aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isSidebarOpen);
  const close = () => dispatch(closeSidebar());

  // Close the drawer when the page changes (e.g. browser back button)
  useEffect(() => {
    dispatch(closeSidebar());
  }, [pathname, dispatch]);

  // While the drawer is open on a phone: stop the page behind it from scrolling, and let Escape close it
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeSidebar());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, dispatch]);

  return (
    <>
      {/* Dark overlay behind the drawer on mobile */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
        aria-hidden
      />

      <aside
        id="main-sidebar"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-gray-200 bg-white pt-safe pb-safe pl-safe",
          "transition-transform duration-200 ease-out lg:z-30 lg:w-64 lg:translate-x-0",
          isOpen ? "translate-x-0 shadow-xl lg:shadow-none" : "-translate-x-full",
        )}
        aria-label="Main menu"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo />
          <button
            onClick={close}
            className="-mr-2 flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Main">
          {navSections.map((section, index) => (
            <div key={section.title ?? index} className="space-y-1">
              {section.title && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
              )}
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActivePath(pathname, item.href)} onNavigate={close} />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
