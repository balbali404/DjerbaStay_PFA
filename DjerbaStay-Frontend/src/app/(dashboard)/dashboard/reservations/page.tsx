"use client";

import { useCallback, useEffect, useState } from "react";

import ReservationTable from "@/components/dashboard/ReservationTable";
import { fetchHotelReservations, type HotelReservation } from "@/lib/backendApi";

const PAGE_SIZE = 15;

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchHotelReservations({ limit: PAGE_SIZE, page: p });
        setReservations(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1);
  }, [load]);

  function handlePageChange(newPage: number) {
    load(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reservations</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} total reservation${total !== 1 ? "s" : ""}` : "All guest trip plans for your hotel"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <button
            onClick={() => load(page)}
            className="mt-3 text-sm font-semibold text-red-600 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <ReservationTable
          reservations={reservations}
          total={total}
          page={page}
          limit={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
