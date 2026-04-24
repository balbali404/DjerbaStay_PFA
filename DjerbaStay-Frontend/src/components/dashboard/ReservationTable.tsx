"use client";

import { ChevronLeft, ChevronRight, User } from "lucide-react";
import type { HotelReservation } from "@/lib/backendApi";

type Props = {
  reservations: HotelReservation[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
};

const BUDGET_LABELS: Record<number, string> = { 1: "Budget", 2: "Standard", 3: "Luxury" };
const TRANSPORT_LABELS: Record<string, string> = {
  taxi: "Taxi",
  car_rental: "Car rental",
  bus: "Bus",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReservationTable({
  reservations,
  total,
  page,
  limit,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(total / limit);

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
        <User className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-400">No reservations yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Guest
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Trip
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Budget
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Transport
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Booked
              </th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => {
              const budget = r.budget as { total_cost?: number };
              return (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{r.user.fullName}</p>
                    <p className="text-xs text-slate-400">{r.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">
                      {r.days} day{r.days !== 1 ? "s" : ""}, {r.persons} guest{r.persons !== 1 ? "s" : ""}
                    </p>
                    {r.travelStartDate ? (
                      <p className="text-xs text-slate-400">
                        From {formatDate(r.travelStartDate)}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {BUDGET_LABELS[r.budgetLevel] ?? r.budgetLevel}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {TRANSPORT_LABELS[r.transport] ?? r.transport}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {budget?.total_cost != null ? `€${budget.total_cost.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
