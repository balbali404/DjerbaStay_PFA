"use client";

import { BedDouble, CalendarOff, CheckCircle, ClipboardList, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  fetchHotelDashboard,
  updateHotelStatus,
  type HotelDashboardStats,
  type HotelStatus,
} from "@/lib/backendApi";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<HotelDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchHotelDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus() {
    if (!data) return;
    const nextStatus: HotelStatus = data.hotel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setTogglingStatus(true);
      await updateHotelStatus(nextStatus);
      await load();
    } finally {
      setTogglingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-700">{error}</p>
        <button
          onClick={load}
          className="mt-3 text-sm font-semibold text-red-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { hotel, stats } = data;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{hotel.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            {hotel.area ? <span>{hotel.area}</span> : null}
            {hotel.rating ? (
              <>
                <span>·</span>
                <span>★ {hotel.rating.toFixed(1)}</span>
              </>
            ) : null}
            {hotel.priceEuro ? (
              <>
                <span>·</span>
                <span>€{hotel.priceEuro}/night</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={hotel.status} />
          <button
            onClick={toggleStatus}
            disabled={togglingStatus}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60 ${
              hotel.status === "ACTIVE"
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            {togglingStatus
              ? "Updating…"
              : hotel.status === "ACTIVE"
              ? "Mark inactive"
              : "Mark active"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total reservations"
          value={stats.totalReservations}
          icon={<ClipboardList className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="This month"
          value={stats.thisMonthReservations}
          icon={<BedDouble className="h-5 w-5" />}
          accent="emerald"
          description="Reservations in the current calendar month"
        />
        <StatCard
          label="Inactive periods"
          value={stats.upcomingInactivePeriods}
          icon={<CalendarOff className="h-5 w-5" />}
          accent="amber"
          description="Upcoming unavailability windows"
        />
      </div>

      {/* Quick navigation cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            {
              href: "/dashboard/pending-approvals",
              label: "Pending approvals",
              description: "Review and approve guest itineraries",
              icon: <CheckCircle className="h-5 w-5" />,
              color: "text-emerald-600 bg-emerald-50",
            },
            {
              href: "/dashboard/availability",
              label: "Manage availability",
              description: "Set inactive periods and closures",
              icon: <CalendarOff className="h-5 w-5" />,
              color: "text-amber-600 bg-amber-50",
            },
            {
              href: "/dashboard/reservations",
              label: "View reservations",
              description: "Browse guest bookings and trip details",
              icon: <ClipboardList className="h-5 w-5" />,
              color: "text-blue-600 bg-blue-50",
            },
            {
              href: "/dashboard/ml-results",
              label: "ML results",
              description: "Inspect AI-generated trip plans",
              icon: <Sparkles className="h-5 w-5" />,
              color: "text-violet-600 bg-violet-50",
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className={`rounded-xl p-2 ${item.color}`}>{item.icon}</div>
              <div>
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
