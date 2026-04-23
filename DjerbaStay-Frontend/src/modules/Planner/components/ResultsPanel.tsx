import dynamic from "next/dynamic";

import Icon from "@/components/Icon";
import { useLanguage } from "@/lib/language";
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
  const { t } = useLanguage();
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <Icon name="psychology" className="size-4" />
              <span>
                {t("planner.travelStyle")} <span className="font-bold">{results.personality}</span>
              </span>
            </div>
            <div className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-400">
              <span className="font-bold text-primary">
                {results.confidence ? `${Math.round(results.confidence * 100)}%` : "---"}
              </span>{" "}
              {t("planner.match")}
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900">{t("planner.resultsTitle")}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
            <Icon name="calendar_today" className="size-4" />
            <span>{formatTripPeriod(state.startDate, state.days)}</span>
            <span className="text-slate-300">·</span>
            <span>{t("common.travelers", { count: state.persons })}</span>
            <span className="text-slate-300">·</span>
            <span>{t("common.days", { count: state.days })}</span>
            {plannerRequestId ? (
              <>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-primary">{t("planner.request", { id: plannerRequestId.slice(0, 8) })}</span>
              </>
            ) : null}
          </p>
        </div>

        <button
          onClick={onRestart}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition-all hover:bg-slate-200"
        >
          <Icon name="restart_alt" className="size-4" />
          {t("planner.startOver")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
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

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{t("planner.currentlyViewing")}</p>
                <h2 className="text-2xl font-black text-slate-800">
                  {t("common.day")} {dayIndex + 1}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{t("planner.activities")}</p>
                <p className="text-lg font-bold text-slate-700">
                  {Math.max(activityIndex + 1, 0)} / {activePlaces.length}
                </p>
              </div>
            </div>

            <div className="max-h-[300px] space-y-3 overflow-y-auto">
              {activePlaces.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Icon name="explore_off" className="mx-auto mb-2 size-10" />
                  <p>{t("planner.noActivities")}</p>
                </div>
              ) : null}

              {activePlaces.map((place, index) => (
                <div
                  key={`${place.name}-${index}`}
                  className={classNames(
                    "activity-card rounded-xl border border-slate-200 bg-white p-4",
                    index <= activityIndex && "visible",
                    index === activityIndex && "active"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon name="place" className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{place.name}</p>
                      <p className="text-xs text-slate-500">{place.category || t("planner.activity")}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
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

          <div className="rounded-xl bg-gradient-to-br from-primary to-blue-600 p-5 text-white shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">{t("planner.estimatedBudget")}</span>
              <Icon name="payments" className="size-6" />
            </div>
            <div className="mb-1 text-4xl font-black">{formatPrice(results.budget?.total_cost)}</div>
            <p className="text-xs text-white/60">{t("planner.budgetSubtitle")}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
              <div className="text-center">
                <p className="text-xs text-white/60">{t("planner.perDay")}</p>
                <p className="text-lg font-bold">{formatPrice(results.budget?.per_day)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/60">{t("planner.perPerson")}</p>
                <p className="text-lg font-bold">
                  {results.budget ? formatPrice(results.budget.total_cost / state.persons) : "---"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
              <Icon name="analytics" className="size-5 text-primary" />
              {t("planner.costBreakdown")}
            </h3>

            <div className="space-y-4">
              <div className={classNames("budget-item", budgetRevealStep >= 1 && "visible")}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Icon name="attractions" className="size-4 text-primary" />
                    {t("planner.activitiesLabel")}
                  </span>
                  <span className="font-bold text-slate-800">{formatPrice(results.budget?.activities_cost)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: percentWidth(results.budget?.activities_cost || 0, budgetTotal) }}
                  />
                </div>
              </div>

              <div className={classNames("budget-item", budgetRevealStep >= 2 && "visible")}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Icon name="restaurant" className="size-4 text-green-500" />
                    {t("planner.foodDining")}
                  </span>
                  <span className="font-bold text-slate-800">{formatPrice(results.budget?.food_cost)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-green-500 transition-all duration-1000"
                    style={{ width: percentWidth(results.budget?.food_cost || 0, budgetTotal) }}
                  />
                </div>
              </div>

              <div className={classNames("budget-item", budgetRevealStep >= 3 && "visible")}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Icon name="directions_car" className="size-4 text-amber-500" />
                    {t("planner.transport")}
                  </span>
                  <span className="font-bold text-slate-800">{formatPrice(results.budget?.transport_cost)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000"
                    style={{ width: percentWidth(results.budget?.transport_cost || 0, budgetTotal) }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Icon name="commute" className="size-4" />
                  {t("planner.transportMode")}
                </span>
                <span className="font-bold text-slate-700">{transportLabels[state.transport] || state.transport}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
              <Icon name="hotel" className="size-5 text-primary" />
              {t("planner.homeBase")}
            </h3>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon name="apartment" className="size-7 text-primary" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{state.accName || t("planner.accommodationName")}</p>
                <p className="text-sm text-slate-500">{state.accArea || "Djerba"}, Tunisia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
