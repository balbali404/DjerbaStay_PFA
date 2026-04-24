"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import MLResultsTable from "@/components/dashboard/MLResultsTable";
import { fetchHotelMlResults, type HotelMlResult } from "@/lib/backendApi";

export default function MLResultsPage() {
  const [results, setResults] = useState<HotelMlResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(
    async (start?: string, end?: string) => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHotelMlResults({
          limit: 50,
          startDate: start ? new Date(start).toISOString() : undefined,
          endDate: end ? new Date(end).toISOString() : undefined,
        });
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ML results");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    load(startDate || undefined, endDate || undefined);
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    load();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">ML Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-generated trip plans created for guests staying at your hotel
        </p>
      </div>

      {/* Date filter */}
      <form
        onSubmit={handleFilter}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">From date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">To date</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
        >
          <Search className="h-4 w-4" />
          Filter
        </button>
        {(startDate || endDate) ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            Clear
          </button>
        ) : null}
        <p className="ml-auto text-xs text-slate-400">
          {loading ? "Loading…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
        </p>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <button
            onClick={() => load(startDate || undefined, endDate || undefined)}
            className="mt-3 text-sm font-semibold text-red-600 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <MLResultsTable results={results} />
      )}
    </div>
  );
}
