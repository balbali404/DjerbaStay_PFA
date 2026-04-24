"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  BedDouble,
  CalendarOff,
  ClipboardList,
  Home,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { useAuthSession } from "@/lib/authSession";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: BarChart2 },
  { href: "/dashboard/availability", label: "Availability", icon: CalendarOff },
  { href: "/dashboard/reservations", label: "Reservations", icon: ClipboardList },
  { href: "/dashboard/guides", label: "Guides", icon: Users },
  { href: "/dashboard/ml-results", label: "ML Results", icon: Sparkles },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthSession();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="border-b border-slate-200 px-5 py-4">
        <Link href="/" className="flex items-center gap-2 rounded-xl transition-colors hover:bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BedDouble className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900">DjerbaStay</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Full access
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Hotel account
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 p-3">
        <Link
          href="/"
          className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Home className="h-4 w-4" />
          Return to landing page
        </Link>
        <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
          <p className="truncate text-xs font-semibold text-slate-700">{user?.fullName}</p>
          <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
