"use client";

import { useCallback, useEffect, useState } from "react";

import AvailabilityManager from "@/components/dashboard/AvailabilityManager";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { fetchHotelAvailabilities, fetchHotelDashboard, type HotelAvailabilityPeriod, type HotelInfo } from "@/lib/backendApi";

export default function AvailabilityPage() {
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [periods, setPeriods] = useState<HotelAvailabilityPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [dashboard, availability] = await Promise.all([
        fetchHotelDashboard(),
        fetchHotelAvailabilities(),
      ]);
      setHotel(dashboard.hotel);
      setPeriods(availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <button onClick={load} className="mt-3 text-sm font-semibold text-red-600 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Availability</h1>
          {hotel ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{hotel.name}</span>
              <span>·</span>
              <StatusBadge status={hotel.status} />
            </div>
          ) : null}
        </div>
      </div>

      <AvailabilityManager periods={periods} onUpdate={load} />
    </div>
  );
}
