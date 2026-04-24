"use client";

import { useEffect, useState } from "react";

import GuidesManager from "@/components/dashboard/GuidesManager";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { fetchHotelDashboard, fetchHotelGuides, type HotelGuide, type HotelInfo } from "@/lib/backendApi";

export default function GuidesPage() {
  const [hotel, setHotel] = useState<HotelInfo | null>(null);
  const [guides, setGuides] = useState<HotelGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [dashboard, guideList] = await Promise.all([
        fetchHotelDashboard(),
        fetchHotelGuides(),
      ]);
      setHotel(dashboard.hotel);
      setGuides(guideList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load guide data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Guides</h1>
          {hotel ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{hotel.name}</span>
              <span>·</span>
              <StatusBadge status={hotel.status} />
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Manage your hotel's guide team. Toggle availability so guests know who is ready to
        accompany them during their trip.
      </p>

      <GuidesManager initialGuides={guides} />
    </div>
  );
}
