"use client";

import { Sparkles } from "lucide-react";
import type { HotelMlResult, TripPlanResponse } from "@/lib/backendApi";

type Props = {
  results: HotelMlResult[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MLResultsTable({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
        <Sparkles className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-400">No ML results yet</p>
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
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Interests
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Personality
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Est. Cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Generated
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const plan = r.tripPlan as TripPlanResponse & { personality?: string };
              const budget = r.budget as { total_cost?: number };
              const topPlaces = plan?.itinerary
                ?.flatMap((d) => d.places)
                .slice(0, 3)
                .map((p) => p.name);

              return (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{r.user.fullName}</p>
                    <p className="text-xs text-slate-400">{r.user.email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="truncate text-slate-700">{r.interests}</p>
                  </td>
                  <td className="px-4 py-3">
                    {plan?.personality ? (
                      <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {plan.personality}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.days} day{r.days !== 1 ? "s" : ""}
                    {r.travelStartDate ? (
                      <span className="ml-1 text-xs text-slate-400">
                        ({formatDate(r.travelStartDate)})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {budget?.total_cost != null ? `€${budget.total_cost.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                    {topPlaces && topPlaces.length > 0 ? (
                      <p className="mt-0.5 text-[10px] text-slate-400 truncate max-w-[140px]">
                        {topPlaces.join(", ")}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
