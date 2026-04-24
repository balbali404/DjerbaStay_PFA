"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuthSession } from "@/lib/authSession";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isInitializing, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role === "CLIENT") {
      router.replace("/");
    }
  }, [isInitializing, isAuthenticated, user, router]);

  // Show blank screen while auth state resolves
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // During redirect, don't render the layout
  if (!isAuthenticated || user?.role === "CLIENT") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
