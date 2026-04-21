"use client";

import { useEffect, useMemo, useState } from "react";

import Icon from "@/components/Icon";
import {
  estimateBudget,
  getAccommodations,
  planTrip,
  type Accommodation,
} from "@/lib/aiClient";
import { MAX_DAYS } from "./constants";
import ResultsPanel from "./components/ResultsPanel";
import WizardPanel from "./components/WizardPanel";
import type { PlannerState, ToastMessage, ToastType, TripResult, WizardStep } from "./types";
import { buildInterests, getErrorMessage } from "./utils";

function createDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

const initialState: PlannerState = {
  step: 1,
  vibe: "authentic",
  budgetLevel: 2,
  groupType: "family",
  persons: 2,
  days: 3,
  startDate: createDefaultDate(),
  transport: "taxi",
  accId: null,
  accName: null,
  accLat: null,
  accLon: null,
  accArea: null,
};

export default function Planner() {
  const [state, setState] = useState<PlannerState>(initialState);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([]);
  const [loadingAccommodations, setLoadingAccommodations] = useState(true);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [results, setResults] = useState<TripResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [budgetRevealStep, setBudgetRevealStep] = useState(0);

  const itinerary = useMemo(() => results?.itinerary ?? [], [results]);

  function showToast(message: string, type: ToastType = "success") {
    setToast({ message, type });
  }

  useEffect(() => {
    const timer = toast ? setTimeout(() => setToast(null), 3500) : undefined;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAccommodations() {
      try {
        const data = await getAccommodations();
        if (!isMounted) return;
        setAccommodations(data);
        setFilteredAccommodations(data);
      } catch {
        if (!isMounted) return;
        showToast("Failed to load accommodations", "error");
      } finally {
        if (isMounted) {
          setLoadingAccommodations(false);
        }
      }
    }

    fetchAccommodations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!results?.budget) return;

    setBudgetRevealStep(0);
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    timers.push(setTimeout(() => setBudgetRevealStep(1), 350));
    timers.push(setTimeout(() => setBudgetRevealStep(2), 650));
    timers.push(setTimeout(() => setBudgetRevealStep(3), 950));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [results]);

  useEffect(() => {
    if (!results) return;
    setActivityIndex(-1);
  }, [dayIndex, results]);

  useEffect(() => {
    if (!autoPlay || !results) return;

    const timer = setTimeout(() => {
      advanceActivity();
    }, 1800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, results, dayIndex, activityIndex]);

  function advanceActivity() {
    if (!results) return;

    const places = itinerary[dayIndex]?.places ?? [];
    if (!places.length) {
      if (dayIndex < itinerary.length - 1) {
        setDayIndex((prev) => prev + 1);
      } else {
        setAutoPlay(false);
      }
      return;
    }

    const nextIndex = activityIndex + 1;
    if (nextIndex >= places.length) {
      if (dayIndex < itinerary.length - 1) {
        setDayIndex((prev) => prev + 1);
        setActivityIndex(-1);
      } else {
        setAutoPlay(false);
        showToast("Itinerary complete!", "success");
      }
      return;
    }

    setActivityIndex(nextIndex);
  }

  function navigateStep(step: WizardStep) {
    setState((prev) => ({ ...prev, step }));
  }

  function setDate(value: string) {
    setState((prev) => ({
      ...prev,
      startDate: value ? new Date(`${value}T00:00:00`) : null,
    }));
  }

  function adjustPersons(delta: number) {
    setState((prev) => ({
      ...prev,
      persons: Math.max(1, Math.min(10, prev.persons + delta)),
    }));
  }

  function adjustDays(delta: number) {
    setState((prev) => ({
      ...prev,
      days: Math.max(1, Math.min(MAX_DAYS, prev.days + delta)),
    }));
  }

  function filterAccommodations(query: string) {
    const q = query.toLowerCase();
    setFilteredAccommodations(
      accommodations.filter(
        (acc) =>
          acc.name.toLowerCase().includes(q) ||
          (acc.area || "").toLowerCase().includes(q)
      )
    );
  }

  function pickAccommodation(acc: Accommodation) {
    setState((prev) => ({
      ...prev,
      accId: acc.id,
      accName: acc.name,
      accLat: acc.latitude,
      accLon: acc.longitude,
      accArea: acc.area || "Djerba",
    }));
    showToast(`Selected: ${acc.name}`);
  }

  function clearAccommodation() {
    setState((prev) => ({
      ...prev,
      accId: null,
      accName: null,
      accLat: null,
      accLon: null,
      accArea: null,
    }));
    setFilteredAccommodations(accommodations);
  }

  async function generateStay() {
    if (!state.accName || state.accLat === null || state.accLon === null) {
      showToast("Please select an accommodation", "error");
      navigateStep(3);
      return;
    }

    setIsGenerating(true);
    setAutoPlay(false);
    setActivityIndex(-1);
    setDayIndex(0);

    try {
      const tripPayload = {
        interests: buildInterests(state),
        days: state.days,
        accommodation_name: state.accName,
        accommodation_lat: state.accLat,
        accommodation_lon: state.accLon,
      };

      const budgetPayload = {
        days: state.days,
        persons: state.persons,
        budget_level: state.budgetLevel,
        transport: state.transport,
      };

      const [tripData, budgetData] = await Promise.all([
        planTrip(tripPayload),
        estimateBudget(budgetPayload),
      ]);

      setResults({ ...tripData, budget: budgetData });
      showToast("Your personalized itinerary is ready!", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setAutoPlay(true);
      }, 1000);
    } catch (error: unknown) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsGenerating(false);
    }
  }

  function resetPlanner() {
    setResults(null);
    setAutoPlay(false);
    setDayIndex(0);
    setActivityIndex(-1);
    setState((prev) => ({ ...prev, step: 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 lg:px-20 py-10">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <Icon
              name={
                toast.type === "success"
                  ? "check_circle"
                  : toast.type === "error"
                    ? "error"
                    : "warning"
              }
              className="size-5"
            />
            {toast.message}
          </div>
        </div>
      )}

      {results ? (
        <ResultsPanel
          results={results}
          state={state}
          dayIndex={dayIndex}
          activityIndex={activityIndex}
          autoPlay={autoPlay}
          budgetRevealStep={budgetRevealStep}
          onRestart={resetPlanner}
          onSelectDay={(index) => {
            setAutoPlay(false);
            setDayIndex(index);
          }}
          onPrevDay={() => {
            setAutoPlay(false);
            setDayIndex((prev) => Math.max(0, prev - 1));
          }}
          onNextDay={() => {
            setAutoPlay(false);
            setDayIndex((prev) => Math.min(itinerary.length - 1, prev + 1));
          }}
          onToggleAutoPlay={() => setAutoPlay((prev) => !prev)}
        />
      ) : (
        <WizardPanel
          state={state}
          filteredAccommodations={filteredAccommodations}
          loadingAccommodations={loadingAccommodations}
          isGenerating={isGenerating}
          onNavigateStep={navigateStep}
          onSetVibe={(vibe) => setState((prev) => ({ ...prev, vibe }))}
          onSetBudgetLevel={(budgetLevel) =>
            setState((prev) => ({ ...prev, budgetLevel }))
          }
          onSetGroupType={(groupType) => setState((prev) => ({ ...prev, groupType }))}
          onAdjustPersons={adjustPersons}
          onAdjustDays={adjustDays}
          onSetDate={setDate}
          onFilterAccommodations={filterAccommodations}
          onPickAccommodation={pickAccommodation}
          onClearAccommodation={clearAccommodation}
          onSetTransport={(transport) => setState((prev) => ({ ...prev, transport }))}
          onGenerate={generateStay}
        />
      )}
    </div>
  );
}
