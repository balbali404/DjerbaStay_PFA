import Image from "next/image";

import Icon from "@/components/Icon";
import type { Accommodation } from "@/lib/aiClient";
import { costMap, groupCards, transportCards, vibeCards } from "../constants";
import type { PlannerState, WizardStep } from "../types";
import { classNames, formatDateRange } from "../utils";

type WizardPanelProps = {
  state: PlannerState;
  filteredAccommodations: Accommodation[];
  loadingAccommodations: boolean;
  isGenerating: boolean;
  onNavigateStep: (step: WizardStep) => void;
  onSetVibe: (vibe: PlannerState["vibe"]) => void;
  onSetBudgetLevel: (level: PlannerState["budgetLevel"]) => void;
  onSetGroupType: (group: PlannerState["groupType"]) => void;
  onAdjustPersons: (delta: number) => void;
  onAdjustDays: (delta: number) => void;
  onSetDate: (value: string) => void;
  onFilterAccommodations: (query: string) => void;
  onPickAccommodation: (acc: Accommodation) => void;
  onClearAccommodation: () => void;
  onSetTransport: (transport: PlannerState["transport"]) => void;
  onGenerate: () => void;
};

function stepTitle(step: WizardStep) {
  if (step === 1) return "Personalize Your Journey";
  if (step === 2) return "Who is Traveling?";
  return "Logistics and Details";
}

function stepProgress(step: WizardStep) {
  if (step === 1) return 33;
  if (step === 2) return 66;
  return 100;
}

export default function WizardPanel({
  state,
  filteredAccommodations,
  loadingAccommodations,
  isGenerating,
  onNavigateStep,
  onSetVibe,
  onSetBudgetLevel,
  onSetGroupType,
  onAdjustPersons,
  onAdjustDays,
  onSetDate,
  onFilterAccommodations,
  onPickAccommodation,
  onClearAccommodation,
  onSetTransport,
  onGenerate,
}: WizardPanelProps) {
  const progress = stepProgress(state.step);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-8 space-y-12">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-widest">
                Step {state.step} of 3
              </span>
              <h2 className="text-3xl font-extrabold mt-1">{stepTitle(state.step)}</h2>
            </div>
            <span className="text-slate-400 font-medium">{progress}% Complete</span>
          </div>

          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {state.step === 1 && (
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon name="auto_awesome" className="size-5 text-primary" />
                <h3 className="text-xl font-bold">What&apos;s your vibe?</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vibeCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onSetVibe(card.id)}
                    className={classNames(
                      "vibe-btn group relative flex flex-col gap-3 p-2 rounded-xl border-2 border-transparent bg-white shadow-sm transition-all text-left",
                      state.vibe === card.id && "option-selected option-selected-bg"
                    )}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Image
                        className="w-full h-full object-cover"
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="px-2 pb-2">
                      <p className="font-bold text-sm">{card.title}</p>
                      <p className="text-xs text-slate-500">{card.subtitle}</p>
                    </div>
                    <div
                      className={classNames(
                        "selected-indicator absolute top-4 right-4 opacity-0 bg-primary text-white rounded-full p-1 shadow-md transition-opacity",
                        state.vibe === card.id && "opacity-100"
                      )}
                    >
                      <Icon name="check" className="size-3" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon name="payments" className="size-5 text-primary" />
                <h3 className="text-xl font-bold">Define your budget.</h3>
              </div>

              <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between mb-8">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={classNames(
                        "text-center flex-1 transition-all",
                        level === 2 && "border-x border-slate-100",
                        state.budgetLevel === level && "text-primary"
                      )}
                    >
                      <span
                        className={classNames(
                          "block text-xs font-bold uppercase tracking-tighter",
                          state.budgetLevel === level ? "text-primary" : "text-slate-400"
                        )}
                      >
                        {level === 1 ? "Budget" : level === 2 ? "Standard" : "Premium"}
                      </span>
                      <span
                        className={classNames(
                          "font-black",
                          state.budgetLevel === level
                            ? "text-2xl text-primary"
                            : "text-lg text-slate-400"
                        )}
                      >
                        {level === 1 ? "$" : level === 2 ? "$$" : "$$$"}
                      </span>
                    </div>
                  ))}
                </div>

                <input
                  id="budgetRange"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  max={3}
                  min={1}
                  type="range"
                  value={state.budgetLevel}
                  onChange={(event) => onSetBudgetLevel(Number(event.target.value) as 1 | 2 | 3)}
                />

                <p className="text-center mt-6 text-sm text-slate-500 italic">
                  &quot;We prioritize the best value experiences within your range.&quot;
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon name="location_on" className="size-5 text-primary" />
                <h3 className="text-xl font-bold">Choose your home base</h3>
              </div>

              <p className="text-sm text-slate-500">
                Search to select your booked accommodation, or choose from our list.
              </p>

              <div className="relative">
                <Icon
                  name="search"
                  className="size-4 absolute left-4 top-3.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search hotels, houses..."
                  onChange={(event) => onFilterAccommodations(event.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm outline-none transition-all"
                />
              </div>

              {state.accName ? (
                <div className="bg-primary/5 border border-primary rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Icon name="hotel" className="size-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{state.accName}</div>
                      <div className="text-xs text-slate-500">{state.accArea}</div>
                    </div>
                  </div>
                  <button
                    onClick={onClearAccommodation}
                    className="text-red-500 hover:text-red-700 text-sm font-bold p-2"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                  {loadingAccommodations && (
                    <div className="p-4 text-sm text-slate-400">Loading accommodations...</div>
                  )}

                  {!loadingAccommodations && filteredAccommodations.length === 0 && (
                    <div className="p-4 text-sm text-slate-500">No matches found.</div>
                  )}

                  {!loadingAccommodations &&
                    filteredAccommodations.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => onPickAccommodation(acc)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-primary/20 text-left"
                      >
                        <div className="size-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <Icon name="hotel" className="size-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-slate-800">{acc.name}</div>
                          <div className="text-xs text-slate-400">{acc.area || "Djerba"}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </section>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onNavigateStep(2)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                Next Step
                <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>
        )}

        {state.step === 2 && (
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon name="group" className="size-5 text-primary" />
                <h3 className="text-xl font-bold">Who are you travelling with?</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {groupCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onSetGroupType(card.id)}
                    className={classNames(
                      "group-btn flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-slate-100 bg-white transition-all shadow-sm",
                      state.groupType === card.id && "option-selected option-selected-bg"
                    )}
                  >
                    <span className="text-3xl">{card.emoji}</span>
                    <span className="font-bold text-sm">{card.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
                  <Icon name="person" className="size-5" /> Travelers
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => onAdjustPersons(-1)} className="stepper-btn">
                    -
                  </button>
                  <div className="text-3xl font-black text-slate-800">{state.persons}</div>
                  <button onClick={() => onAdjustPersons(1)} className="stepper-btn">
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
                  <Icon name="calendar_month" className="size-5" /> Duration
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => onAdjustDays(-1)} className="stepper-btn">
                    -
                  </button>
                  <div className="text-3xl font-black text-slate-800">{state.days}</div>
                  <button onClick={() => onAdjustDays(1)} className="stepper-btn">
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-widest">
                  <Icon name="event" className="size-5" /> Start Date
                </div>
                <input
                  type="date"
                  onChange={(event) => onSetDate(event.target.value)}
                  value={state.startDate ? state.startDate.toISOString().split("T")[0] : ""}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm outline-none transition-all text-slate-800 font-bold text-center text-lg"
                />
              </div>
            </section>

            <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <Icon name="date_range" className="size-4" />
              <span>{formatDateRange(state.startDate, state.days)}</span>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => onNavigateStep(1)}
                className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 transition-colors"
              >
                <Icon name="arrow_back" className="size-4" /> Back
              </button>
              <button
                onClick={() => onNavigateStep(3)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                Next Step <Icon name="arrow_forward" className="size-4" />
              </button>
            </div>
          </div>
        )}

        {state.step === 3 && (
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Icon name="directions_car" className="size-5 text-primary" />
                <h3 className="text-xl font-bold">How will you get around?</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {transportCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onSetTransport(card.id)}
                    className={classNames(
                      "trans-btn group flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 bg-white transition-all text-left shadow-sm",
                      state.transport === card.id && "option-selected option-selected-bg"
                    )}
                  >
                    <span className="text-2xl">{card.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{card.title}</div>
                      <div className="text-xs text-slate-500">{card.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => onNavigateStep(2)}
                className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 transition-colors"
              >
                <Icon name="arrow_back" className="size-4" /> Back
              </button>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <Icon name="check_circle" className="size-4" /> Ready to generate
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-8">
        <div className="sticky top-32 space-y-8">
          <div className="med-pattern p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Icon name="psychology" className="size-5" />
                <span className="font-bold text-sm uppercase tracking-wider">Why this matters</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our ML engine analyzes booking patterns in Djerba to build a tailored itinerary.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500">Estimated Daily Cost</span>
                  <span className="text-lg font-bold text-primary">{costMap[state.budgetLevel]}</span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Based on your current selections
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={onGenerate}
              disabled={state.step !== 3 || isGenerating}
              className={classNames(
                "w-full group relative flex items-center justify-center gap-3 py-6 px-8 text-white rounded-2xl font-bold text-lg shadow-xl transition-all",
                state.step !== 3 || isGenerating
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 shadow-primary/30 active:scale-[0.98]"
              )}
            >
              <span
                className={classNames("inline-flex", isGenerating && "animate-spin")}
              >
                <Icon name={isGenerating ? "sync" : "bolt"} className="size-5" />
              </span>
              {isGenerating ? "Generating..." : "Generate My Stay"}
              <div className="absolute -top-3 -right-3 bg-white text-slate-400 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter border border-slate-200 shadow-sm">
                Powered by ML
              </div>
            </button>

            <p className="text-center text-xs text-slate-400">
              {state.step === 3
                ? `Click to generate a tailored ${state.days}-day itinerary.`
                : "Complete all 3 steps to unlock generation."}
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden grayscale opacity-50 contrast-125 border border-slate-200 h-48 relative">
            <Image
              className="w-full h-full object-cover"
              src="/images/planner/map-preview.svg"
              alt="Djerba map preview"
              fill
              sizes="(max-width: 1024px) 100vw, 30vw"
            />
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
              <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2">
                <Icon name="location_on" className="size-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Djerba, Tunisia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
