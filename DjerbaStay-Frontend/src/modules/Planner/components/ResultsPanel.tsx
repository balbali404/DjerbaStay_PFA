import dynamic from "next/dynamic";

import Icon from "@/components/Icon";
import { transportLabels } from "../constants";
import type { PlannerState, TripResult } from "../types";
import { classNames, formatPrice, formatTripPeriod } from "../utils";

const TripMap = dynamic(() => import("./TripMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center bg-slate-100 text-slate-400">
      Loading map...
    </div>
  ),
});

type ResultsPanelProps = {
  results: TripResult;
  plannerRequestId: string | null;
  state: PlannerState;
  dayIndex: number;
  activityIndex: number;
  autoPlay: boolean;
  budgetRevealStep: number;
  onRestart: () => void;
  onSelectDay: (index: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToggleAutoPlay: () => void;
};

function percentWidth(value: number, total: number) {
  if (!total) {
    return "0%";
  }
  return `${(value / total) * 100}%`;
}

export default function ResultsPanel({
  results,
  plannerRequestId,
  state,
  dayIndex,
  activityIndex,
  autoPlay,
  budgetRevealStep,
  onRestart,
  onSelectDay,
  onPrevDay,
  onNextDay,
  onToggleAutoPlay,
}: ResultsPanelProps) {
  const itinerary = results.itinerary ?? [];
  const activePlaces = itinerary[dayIndex]?.places ?? [];
  const progressPct =
    activityIndex < 0 || activePlaces.length === 0
      ? 0
      : Math.min(100, ((activityIndex + 1) / activePlaces.length) * 100);

  const budgetTotal =
    (results.budget?.activities_cost || 0) +
    (results.budget?.food_cost || 0) +
    (results.budget?.transport_cost || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              <Icon name="psychology" className="size-4" />
              <span>
                Your Travel Style: <span className="font-bold">{results.personality}</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              <span className="font-bold text-primary">
                {results.confidence ? `${Math.round(results.confidence * 100)}%` : "---"}
              </span>{" "}
              match
            </div>
          </div>
          <h1 className="text-slate-900 text-3xl font-black">Your Djerba Adventure</h1>
          <p className="text-slate-500 flex flex-wrap items-center gap-2 mt-1">
            <Icon name="calendar_today" className="size-4" />
            <span>{formatTripPeriod(state.startDate, state.days)}</span>
            <span className="text-slate-300">•</span>
            <span>{state.persons} travelers</span>
            <span className="text-slate-300">•</span>
            <span>{state.days} days</span>
            {plannerRequestId ? (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-primary">Request #{plannerRequestId.slice(0, 8)}</span>
              </>
            ) : null}
          </p>
        </div>

        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all"
        >
          <Icon name="restart_alt" className="size-4" />
          Start Over
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden sticky top-24">
            <TripMap
              accommodationName={state.accName || "Accommodation"}
              accommodationLat={state.accLat ?? 33.8076}
              accommodationLon={state.accLon ?? 10.8451}
              itinerary={itinerary}
              dayIndex={dayIndex}
              activityIndex={activityIndex}
              autoPlay={autoPlay}
              progressPct={progressPct}
              onSelectDay={onSelectDay}
              onPrevDay={onPrevDay}
              onNextDay={onNextDay}
              onToggleAutoPlay={onToggleAutoPlay}
            />
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">
                  Currently Viewing
                </p>
                <h2 className="text-2xl font-black text-slate-800">Day {dayIndex + 1}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Activities</p>
                <p className="text-lg font-bold text-slate-700">
                  {Math.max(activityIndex + 1, 0)} / {activePlaces.length}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activePlaces.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Icon name="explore_off" className="size-10 mb-2 mx-auto" />
                  <p>No activities for this day</p>
                </div>
              )}

              {activePlaces.map((place, index) => (
                <div
                  key={`${place.name}-${index}`}
                  className={classNames(
                    "activity-card p-4 rounded-xl border border-slate-200 bg-white",
                    index <= activityIndex && "visible",
                    index === activityIndex && "active"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="place" className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{place.name}</p>
                      <p className="text-xs text-slate-500">{place.category || "Activity"}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" className="size-3.5" />
                          {place.duration_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="straighten" className="size-3.5" />
                          {place.distance_from_accommodation_km} km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/80 font-medium text-sm">Estimated Budget</span>
              <Icon name="payments" className="size-6" />
            </div>
            <div className="text-4xl font-black mb-1">{formatPrice(results.budget?.total_cost)}</div>
            <p className="text-white/60 text-xs">
              Activities, food and transport (excluding accommodation)
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-xs text-white/60">Per Day</p>
                <p className="text-lg font-bold">{formatPrice(results.budget?.per_day)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/60">Per Person</p>
                <p className="text-lg font-bold">
                  {results.budget
                    ? formatPrice(results.budget.total_cost / state.persons)
                    : "---"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Icon name="analytics" className="size-5 text-primary" />
              Cost Breakdown
            </h3>

            <div className="space-y-4">
              <div className={classNames("budget-item", budgetRevealStep >= 1 && "visible")}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Icon name="attractions" className="size-4 text-primary" />
                    Activities
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(results.budget?.activities_cost)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-1000"
                    style={{
                      width: percentWidth(results.budget?.activities_cost || 0, budgetTotal),
                    }}
                  />
                </div>
              </div>

              <div className={classNames("budget-item", budgetRevealStep >= 2 && "visible")}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Icon name="restaurant" className="size-4 text-green-500" />
                    Food and Dining
                  </span>
                  <span className="font-bold text-slate-800">{formatPrice(results.budget?.food_cost)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-1000"
                    style={{ width: percentWidth(results.budget?.food_cost || 0, budgetTotal) }}
                  />
                </div>
              </div>

              <div className={classNames("budget-item", budgetRevealStep >= 3 && "visible")}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Icon name="directions_car" className="size-4 text-amber-500" />
                    Transport
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatPrice(results.budget?.transport_cost)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-1000"
                    style={{
                      width: percentWidth(results.budget?.transport_cost || 0, budgetTotal),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Icon name="commute" className="size-4" />
                  Transport Mode
                </span>
                <span className="font-bold text-slate-700">
                  {transportLabels[state.transport] || state.transport}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Icon name="hotel" className="size-5 text-primary" />
              Your Home Base
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="apartment" className="size-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{state.accName || "Accommodation Name"}</p>
                <p className="text-sm text-slate-500">{state.accArea || "Djerba"}, Tunisia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
