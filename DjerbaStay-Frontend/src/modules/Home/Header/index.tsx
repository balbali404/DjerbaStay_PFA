"use client";

import Link from "next/link";
import { useState } from "react";

import Icon from "@/components/Icon";
import { useAuthSession } from "@/lib/authSession";

export default function Header() {
  const { user, isAuthenticated, isInitializing, logout } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logoutUser() {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 px-6 lg:px-20 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3 text-primary">
        <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
          <Icon name="holiday_village" className="size-5 text-primary" />
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-extrabold leading-tight tracking-tight">
          DjerbaStay
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-10">
        <div className="hidden md:flex items-center gap-8">
          <Link
            className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            href="/"
          >
            Explore
          </Link>
          <Link
            className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
            href="/planner"
          >
            Suggest Stays
          </Link>
          {isAuthenticated ? (
            <Link
              className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
              href="/planner"
            >
              Planner
            </Link>
          ) : null}
          {isAuthenticated ? (
            <Link
              className="text-slate-700 dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
              href="/profile"
            >
              Profile
            </Link>
          ) : null}
        </div>

        {isInitializing ? (
          <span className="text-sm text-slate-400">Checking session...</span>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline-flex rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
              {user.fullName}
            </span>
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
              {user.plan.code}
            </span>

            <Link
              href="/profile"
              className="flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              Profile
            </Link>

            <button
              onClick={logoutUser}
              disabled={isLoggingOut}
              className="flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-5 border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
            >
              <span>Register</span>
            </Link>
            <Link
              href="/login"
              className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <span>Login</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
