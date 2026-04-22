"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import Icon from "@/components/Icon";
import { getBestRecommendation, type BestRecommendation } from "@/lib/aiClient";

function formatBudget(totalCost: number | null): string {
  if (totalCost === null) {
    return "N/A";
  }

  return `$${Math.round(totalCost)}`;
}

function formatDateLabel(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleDateString();
}

export default function HowItWorks() {
  const [bestRecommendation, setBestRecommendation] = useState<BestRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBestRecommendation() {
      try {
        const recommendation = await getBestRecommendation();
        if (!isMounted) {
          return;
        }

        setBestRecommendation(recommendation);
      } catch {
        if (!isMounted) {
          return;
        }

        setBestRecommendation(null);
      } finally {
        if (isMounted) {
          setIsLoadingRecommendation(false);
        }
      }
    }

    loadBestRecommendation();

    return () => {
      isMounted = false;
    };
  }, []);

  const matchPercent = useMemo(() => {
    if (!bestRecommendation) {
      return 85;
    }

    const computed = Math.round(bestRecommendation.confidence * 100);
    return Math.min(99, Math.max(1, computed));
  }, [bestRecommendation]);

  const topPlaces = bestRecommendation?.topPlaces ?? [];

  return (
    <div className="bg-primary/5 py-24 px-4 lg:px-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 space-y-8">
          <div>
            <h4 className="text-primary font-extrabold tracking-widest text-sm uppercase mb-4 flex items-center gap-2">
              <Icon name="smart_toy" className="size-5" />
              Powered by Machine Learning
            </h4>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Stay Planning, <br />
              <span className="text-primary">Evolved.</span>
            </h2>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed">
            Our recommendation engine now highlights the best saved ML result from real planner runs,
            so visitors can see what the model is producing in production.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center shrink-0">
                <Icon name="psychology" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900">Recommendation Engine</h5>
                <p className="text-slate-500 text-sm">
                  ML results are saved to the database and ranked by confidence.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="size-12 rounded-xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center shrink-0">
                <Icon name="magic_button" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900">Best Result Live Preview</h5>
                <p className="text-slate-500 text-sm">
                  The card on the right updates from saved planner output.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-1/2 relative">
          <div className="relative z-10 bg-white p-8 rounded-3xl shadow-2xl border border-primary/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="font-bold">Recommendation Engine</span>
                <Icon name="more_horiz" className="size-5 text-primary" />
              </div>

              <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="bolt" className="size-4 text-primary" />
                </div>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${matchPercent}%` }}></div>
                </div>
                <span className="text-xs font-bold text-primary">{matchPercent}% Match</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                {isLoadingRecommendation ? (
                  <p className="text-sm text-slate-500">Loading best saved ML result...</p>
                ) : bestRecommendation ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Best Result</p>
                      <p className="text-lg font-bold text-slate-900">
                        {bestRecommendation.accommodation.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {bestRecommendation.personality || "Traveler profile"} · {bestRecommendation.days} days · {bestRecommendation.transport}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {topPlaces.length > 0 ? (
                        topPlaces.map((placeName) => (
                          <span
                            key={placeName}
                            className="rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary"
                          >
                            {placeName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No place highlights available</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      Budget estimate: <span className="font-semibold text-slate-700">{formatBudget(bestRecommendation.estimatedTotalCost)}</span> · Saved {formatDateLabel(bestRecommendation.createdAt)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No saved planner result yet. Generate your first ML plan to populate this section.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-xl bg-slate-100 border-2 border-primary relative overflow-hidden">
                  <Image
                    src="/images/home/how-ml-1.svg"
                    alt="Preference analysis"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 opacity-70 relative overflow-hidden">
                  <Image
                    src="/images/home/how-ml-2.svg"
                    alt="Activity clusters"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-medium">
                  ML output is saved and ranked from real planner generations.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 z-0 w-full h-full bg-primary/10 rounded-3xl -rotate-3"></div>
        </div>
      </div>
    </div>
  );
}
