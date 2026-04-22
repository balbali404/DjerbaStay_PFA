"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import Icon from "@/components/Icon";
import {
  generatePlanner,
  getMlUsage,
  getAccommodations,
  getPlannerById,
  type Accommodation,
  type MlUsage,
} from "@/lib/aiClient";
import { useAuthSession } from "@/lib/authSession";
import { MAX_DAYS } from "./constants";
import type { PlannerState, ToastMessage, ToastType, TripResult, WizardStep } from "./types";
import { buildInterests, getErrorMessage } from "./utils";

const ResultsPanel = dynamic(() => import("./components/ResultsPanel"), {
  loading: () => (
    <div className="h-[440px] animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
  ),
});

const WizardPanel = dynamic(() => import("./components/WizardPanel"), {
  loading: () => (
    <div className="h-[440px] animate-pulse rounded-3xl border border-slate-200 bg-white/70" />
  ),
});

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const plannerRequestIdFromUrl = searchParams.get("requestId");
  const { isAuthenticated, isInitializing } = useAuthSession();

  const [state, setState] = useState<PlannerState>(initialState);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState<Accommodation[]>([]);
  const [loadingAccommodations, setLoadingAccommodations] = useState(true);
  const [loadingSavedPlanner, setLoadingSavedPlanner] = useState(false);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [results, setResults] = useState<TripResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(-1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [budgetRevealStep, setBudgetRevealStep] = useState(0);
  const [usage, setUsage] = useState<MlUsage | null>(null);
  const [plannerRequestId, setPlannerRequestId] = useState<string | null>(null);

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

    async function loadPlannerData() {
      try {
        const [accommodationData, usageData] = await Promise.all([
          getAccommodations(),
          isAuthenticated ? getMlUsage().catch(() => null) : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setAccommodations(accommodationData);
        setFilteredAccommodations(accommodationData);
        if (usageData) {
          setUsage(usageData);
        }
      } catch {
        if (!isMounted) return;
        showToast("Failed to load accommodations", "error");
      } finally {
        if (isMounted) {
          setLoadingAccommodations(false);
        }
      }
    }

    loadPlannerData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingSavedPlanner(false);
      return;
    }

    if (!plannerRequestIdFromUrl) {
      setPlannerRequestId(null);
      return;
    }

    let isMounted = true;
    setLoadingSavedPlanner(true);

    getPlannerById(plannerRequestIdFromUrl)
      .then((data) => {
        if (!isMounted) return;

        setPlannerRequestId(data.id);
        setResults({ ...data.tripPlan, budget: data.budget });
        setState((prev) => ({
          ...prev,
          step: 3,
          days: data.days,
          persons: data.persons,
          budgetLevel: data.budgetLevel as 1 | 2 | 3,
          transport: data.transport,
          accId: data.accommodation.id,
          accName: data.accommodation.name,
          accLat: data.accommodation.latitude,
          accLon: data.accommodation.longitude,
          accArea: data.accommodation.area || "Djerba",
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        showToast("Failed to load planner request by ID", "error");
      })
      .finally(() => {
        if (isMounted) {
          setLoadingSavedPlanner(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [plannerRequestIdFromUrl, isAuthenticated]);

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
    if (!state.accId || !state.accName || state.accLat === null || state.accLon === null) {
      showToast("Please select an accommodation", "error");
      navigateStep(3);
      return;
    }

    setIsGenerating(true);
    setAutoPlay(false);
    setActivityIndex(-1);
    setDayIndex(0);

    try {
      const payload = {
        accommodationId: state.accId,
        interests: buildInterests(state),
        days: state.days,
        persons: state.persons,
        budgetLevel: state.budgetLevel,
        transport: state.transport,
      };

      const response = await generatePlanner(payload);

      setPlannerRequestId(response.requestId);
      setUsage(response.usage);
      setResults({ ...response.tripPlan, budget: response.budget });
      showToast("Your personalized itinerary is ready!", "success");
      router.replace(`/planner?requestId=${response.requestId}`);
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
    setPlannerRequestId(null);
    setResults(null);
    setAutoPlay(false);
    setDayIndex(0);
    setActivityIndex(-1);
    setState((prev) => ({ ...prev, step: 1 }));
    router.replace("/planner");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 lg:px-20 py-10">
      {!isInitializing && !isAuthenticated ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">Sign in to use the AI planner</h2>
          <p className="mt-3 text-slate-500">
            Planner generation is secured through the Express backend and requires your account session.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Register
            </Link>
          </div>
        </div>
      ) : null}

      {isInitializing || !isAuthenticated ? null : (
        <>
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
          plannerRequestId={plannerRequestId}
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
          usage={usage}
          filteredAccommodations={filteredAccommodations}
          loadingAccommodations={loadingAccommodations || loadingSavedPlanner}
          isGenerating={isGenerating || loadingSavedPlanner}
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
        </>
      )}
    </div>
  );
}
