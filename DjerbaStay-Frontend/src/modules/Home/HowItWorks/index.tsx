"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import Icon from "@/components/Icon";
import { getBestRecommendation, type BestRecommendation } from "@/lib/aiClient";
import { useLanguage } from "@/lib/language";
import { vibeCards } from "@/modules/Planner/constants";

function formatBudget(totalCost: number | null, locale: string, naLabel: string): string {
  if (totalCost === null) {
    return naLabel;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(totalCost));
}

function formatDateLabel(isoDate: string, locale: string, fallback: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString(locale);
}

export default function HowItWorks() {
  const { t, locale } = useLanguage();
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
  const selectedVibeImage =
    vibeCards.find((card) => card.id === bestRecommendation?.vibe)?.image ?? "/images/home/how-ml-1.svg";
  const selectedAccommodationImage =
    bestRecommendation?.accommodation.imageUrl ?? "/images/home/how-ml-2.svg";

  return (
    <div className="relative overflow-hidden bg-primary/5 px-4 py-24 lg:px-20">
      <div className="absolute -mt-32 -mr-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row">
        <div className="space-y-8 lg:w-1/2">
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-primary">
              <Icon name="smart_toy" className="size-5" />
              {t("home.how.eyebrow")}
            </h4>
            <h2 className="text-4xl font-black leading-tight text-slate-900 md:text-5xl">
              {t("home.how.titleLine1")} <br />
              <span className="text-primary">{t("home.how.titleLine2")}</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-slate-600">{t("home.how.description")}</p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
                <Icon name="psychology" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900">{t("home.how.feature1Title")}</h5>
                <p className="text-sm text-slate-500">{t("home.how.feature1Body")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-md">
                <Icon name="magic_button" className="size-5 text-primary" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900">{t("home.how.feature2Title")}</h5>
                <p className="text-sm text-slate-500">{t("home.how.feature2Body")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative lg:w-1/2">
          <div className="relative z-10 rounded-3xl border border-primary/20 bg-white p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="font-bold">{t("home.how.engineLabel")}</span>
                <Icon name="more_horiz" className="size-5 text-primary" />
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Icon name="bolt" className="size-4 text-primary" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${matchPercent}%` }} />
                </div>
                <span className="text-xs font-bold text-primary">{t("home.how.match", { count: matchPercent })}</span>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                {isLoadingRecommendation ? (
                  <p className="text-sm text-slate-500">{t("home.how.loading")}</p>
                ) : bestRecommendation ? (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{t("home.how.bestResult")}</p>
                      <p className="text-lg font-bold text-slate-900">{bestRecommendation.accommodation.name}</p>
                      <p className="text-sm text-slate-500">
                        {bestRecommendation.personality || t("home.how.travelerProfile")} · {t("common.days", { count: bestRecommendation.days })} · {bestRecommendation.transport}
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
                        <span className="text-xs text-slate-500">{t("home.how.noPlaces")}</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {t("home.how.budgetEstimate")}{" "}
                      <span className="font-semibold text-slate-700">
                        {formatBudget(bestRecommendation.estimatedTotalCost, locale, t("home.how.na"))}
                      </span>{" "}
                      · {t("home.how.saved", { date: formatDateLabel(bestRecommendation.createdAt, locale, t("home.how.recently")) })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">{t("home.how.empty")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-primary bg-slate-100">
                  <Image
                    src={selectedVibeImage}
                    alt={bestRecommendation?.vibe ? `${bestRecommendation.vibe} vibe` : "Selected vibe"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 opacity-70">
                  <Image
                    src={selectedAccommodationImage}
                    alt={bestRecommendation?.accommodation.name || "Selected accommodation"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-400">{t("home.how.footer")}</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 z-0 h-full w-full -rotate-3 rounded-3xl bg-primary/10" />
        </div>
      </div>
    </div>
  );
}
