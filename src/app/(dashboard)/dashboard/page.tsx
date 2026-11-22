"use client";

import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemStatus } from "@/components/dashboard/system-status";
import { useAppSelector } from "@/store/hooks";

// Placeholder numbers until the products / orders modules are built
const stats = [
  { label: "Revenue", value: "ETB 0", hint: "This month", icon: DollarSign },
  { label: "Orders", value: "0", hint: "This month", icon: ShoppingBag },
  { label: "Products", value: "0", hint: "In catalog", icon: Package },
  { label: "Customers", value: "0", hint: "Registered", icon: Users },
];

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Hello, {user?.firstName} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Here is what is happening in your store.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900">Recent orders</h2>
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 py-10 sm:mt-6 sm:py-12 text-center">
            <ShoppingBag className="size-8 text-gray-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-700">No orders yet</p>
            <p className="mt-1 text-xs text-gray-500">Orders from the storefront will show up here.</p>
          </div>
        </section>
        <SystemStatus />
      </div>
    </div>
  );
}
