"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeSidebar } from "@/store/slices/ui.slice";
import { navSections, type NavItem } from "./nav-items";

function NavLink({ item, isActive, onNavigate }: { item: NavItem; isActive: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  const classes = clsx(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
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

  return (
    <>
      {/* Dark overlay behind the drawer on mobile */}
      <div
        className={clsx("fixed inset-0 z-30 bg-gray-900/40 lg:hidden", isOpen ? "block" : "hidden")}
        onClick={close}
        aria-hidden
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button onClick={close} className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
          {navSections.map((section, index) => (
            <div key={section.title ?? index} className="space-y-1">
              {section.title && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  onNavigate={close}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
