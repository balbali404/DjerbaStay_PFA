"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import Icon from "@/components/Icon";
import { useAuthSession } from "@/lib/authSession";

type NavLink = {
  href: string;
  label: string;
};

const primaryLinks: NavLink[] = [
  { href: "/", label: "Explore" },
  { href: "/planner", label: "AI Planner" },
  { href: "/accommodations", label: "Stays" },
];

function getDesktopLinkClass(pathname: string, href: string): string {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return isActive
    ? "rounded-full bg-primary/10 px-4 py-2.5 text-base font-extrabold text-primary"
    : "rounded-full px-4 py-2.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-primary";
}

function getMobileLinkClass(pathname: string, href: string): string {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return isActive
    ? "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-base font-bold text-primary"
    : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700";
}

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, isInitializing, logout } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  async function logoutUser() {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  }

  const desktopLinks = isAuthenticated
    ? [...primaryLinks, { href: "/profile", label: "Profile" }]
    : primaryLinks;

  const mobileLinks = isAuthenticated
    ? [...primaryLinks, { href: "/profile", label: "Profile" }]
    : primaryLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-4 sm:px-6 md:py-5 lg:px-16 xl:px-20">
        <Link href="/" className="flex items-center gap-3 text-primary">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 sm:size-12">
            <Icon name="holiday_village" className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">Island Guide</p>
            <h2 className="text-2xl font-black leading-none tracking-tight text-slate-900">DjerbaStay</h2>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {desktopLinks.map((link) => (
            <Link key={link.href} className={getDesktopLinkClass(pathname, link.href)} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isInitializing ? (
            <span className="hidden text-sm font-semibold text-slate-400 sm:inline">Checking session...</span>
          ) : isAuthenticated && user ? (
            <>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                  {user.fullName}
                </span>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-black text-primary">
                  {user.plan.code}
                </span>
                <button
                  onClick={logoutUser}
                  disabled={isLoggingOut}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </button>
              </div>

              <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary lg:hidden">
                {user.plan.code}
              </span>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/register"
                className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 min-w-[110px] items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Login
              </Link>
            </div>
          )}

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <Icon name={isMenuOpen ? "close" : "menu"} className="size-5" />
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-4 lg:hidden">
          <nav className="grid gap-2">
            {mobileLinks.map((link) => (
              <Link key={link.href} href={link.href} className={getMobileLinkClass(pathname, link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {isInitializing ? (
              <p className="text-sm text-slate-400">Checking session...</p>
            ) : isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
                  <p className="mt-1 text-base font-black text-slate-800">{user.fullName}</p>
                  <span className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                    {user.plan.code} plan
                  </span>
                </div>
                <button
                  onClick={logoutUser}
                  disabled={isLoggingOut}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name="logout" className="size-4" />
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {!isInitializing && !isAuthenticated ? (
        <div className="px-4 pb-4 sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
