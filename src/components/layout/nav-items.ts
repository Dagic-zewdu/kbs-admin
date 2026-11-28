import {
  BarChart3,
  Bike,
  Boxes,
  FolderTree,
  LayoutDashboard,
  MapPinned,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shown as "Soon" and not clickable until the page is built */
  comingSoon?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Add new pages here and they appear in the sidebar
export const navSections: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: FolderTree },
      { label: "Brands", href: "/brands", icon: Tag },
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Sales", href: "/sales", icon: ShoppingBag },
      { label: "Deliveries", href: "/deliveries", icon: MapPinned },
      { label: "Deliverers", href: "/deliverers", icon: Bike },
      { label: "Discounts", href: "/discounts", icon: Percent, comingSoon: true },
      { label: "Reports", href: "/reports", icon: BarChart3, comingSoon: true },
    ],
  },
  {
    title: "Management",
    items: [{ label: "Users", href: "/users", icon: Users }],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export const isActivePath = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

const MOBILE_PAGES = ["/dashboard", "/sales", "/products", "/inventory"];

/** Pages pinned to the bottom bar on phones (max 4, the 5th slot is "Menu"): selling comes first on a phone */
export const mobileNavItems: NavItem[] = MOBILE_PAGES.flatMap((href) =>
  navSections.flatMap((section) => section.items).filter((item) => item.href === href && !item.comingSoon),
);
