"use client";

import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  createHotelAvailability,
  deleteHotelAvailability,
  type HotelAvailabilityPeriod,
} from "@/lib/backendApi";

type Props = {
  periods: HotelAvailabilityPeriod[];
  onUpdate: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isPast(endDate: string) {
  return new Date(endDate) < new Date();
}

export default function AvailabilityManager({ periods, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      await createHotelAvailability({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason: reason.trim() || undefined,
      });

      setStartDate("");
      setEndDate("");
      setReason("");
      setShowForm(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create period");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteHotelAvailability(id);
      onUpdate();
    } finally {
      setDeletingId(null);
    }
  }

  const upcoming = periods.filter((p) => !isPast(p.endDate));
  const past = periods.filter((p) => isPast(p.endDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inactive Periods</h2>
          <p className="text-sm text-slate-500">
            Mark dates when your hotel is unavailable for bookings
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add period
        </button>
      </div>

      {/* Create form */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="mb-4 font-semibold text-slate-800">New inactive period</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Reason (optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="e.g. Renovation, seasonal closure…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error ? (
            <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save period"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Upcoming periods */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Upcoming ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
            <CalendarOff className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No upcoming inactive periods</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(p.startDate)} → {formatDate(p.endDate)}
                  </p>
                  {p.reason ? (
                    <p className="text-xs text-slate-500">{p.reason}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="ml-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete period"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past periods */}
      {past.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Past ({past.length})
          </h3>
          <div className="space-y-2">
            {past.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatDate(p.startDate)} → {formatDate(p.endDate)}
                  </p>
                  {p.reason ? (
                    <p className="text-xs text-slate-400">{p.reason}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="ml-4 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400 disabled:opacity-50"
                  aria-label="Delete period"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
