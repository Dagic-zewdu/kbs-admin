import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingBag,
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
      { label: "Products", href: "/products", icon: Package, comingSoon: true },
      { label: "Categories", href: "/categories", icon: FolderTree, comingSoon: true },
      { label: "Inventory", href: "/inventory", icon: Boxes, comingSoon: true },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag, comingSoon: true },
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
    items: [{ label: "Settings", href: "/settings", icon: Settings, comingSoon: true }],
  },
];
