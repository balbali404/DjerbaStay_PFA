"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { persistAccessToken, type SubscriptionCode } from "@/lib/backendApi";
import { useAuthSession } from "@/lib/authSession";
import { useLanguage } from "@/lib/language";

export default function PricingSection() {
  const router = useRouter();
  const { user, plans, isAuthenticated, createCheckout } = useAuthSession();
  const { t, tList } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlanCode = user?.plan.code;

  const freePlan = plans.find((p) => p.code === "FREE");
  const plusPlan = plans.find((p) => p.code === "PLUS");
  const premiumPlan = plans.find((p) => p.code === "PREMIUM");

  async function handleSelectPlan(planCode: SubscriptionCode) {
    setError(null);

    if (!isAuthenticated) {
      router.push("/register");
      return;
    }

    if (planCode === currentPlanCode) {
      return;
    }

    if (planCode === "FREE" && currentPlanCode === "PLUS") {
      setError(t("home.pricing.freeError"));
      return;
    }

    if (planCode === "PLUS" || planCode === "PREMIUM") {
      try {
        setLoadingPlan(planCode);
        const session = await createCheckout(planCode);
        if (session.accessToken) {
          persistAccessToken(session.accessToken);
        }
        window.location.assign(session.checkoutUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("home.pricing.checkoutError"));
      } finally {
        setLoadingPlan(null);
      }
    }
  }

  const plansDisplay = [
    {
      code: "FREE" as SubscriptionCode,
      name: t("home.pricing.free.name"),
      tagline: t("home.pricing.free.tagline"),
      price: "$0",
      period: t("home.pricing.forever"),
      highlight: false,
      features: tList("home.pricing.free.features", { requests: freePlan?.monthlyMlRequests ?? 10 }),
    },
    {
      code: "PLUS" as SubscriptionCode,
      name: t("home.pricing.plus.name"),
      tagline: t("home.pricing.plus.tagline"),
      price: plusPlan ? `$${plusPlan.monthlyPriceUsd}` : "$4.99",
      period: t("home.pricing.perMonth"),
      highlight: true,
      features: tList("home.pricing.plus.features", { requests: plusPlan?.monthlyMlRequests ?? 60 }),
    },
    {
      code: "PREMIUM" as SubscriptionCode,
      name: t("home.pricing.premium.name"),
      tagline: t("home.pricing.premium.tagline"),
      price: premiumPlan ? `$${premiumPlan.monthlyPriceUsd}` : "$9.99",
      period: t("home.pricing.perMonth"),
      highlight: false,
      features: tList("home.pricing.premium.features"),
    },
  ];

  return (
    <section id="pricing" className="px-4 py-20 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-black text-slate-900">{t("home.pricing.title")}</h2>
          <p className="mt-4 text-lg text-slate-600">{t("home.pricing.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          {plansDisplay.map((plan) => (
            <div
              key={plan.code}
              className={`relative flex flex-col rounded-3xl border p-8 shadow-xl transition-all ${
                plan.highlight
                  ? "scale-[1.02] border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-lg">
                  {t("home.pricing.mostPopular")}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <p className={`mt-1 text-sm font-medium ${plan.highlight ? "text-white/80" : "text-slate-500"}`}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black">{plan.price}</span>
                <span className={`text-lg font-medium ${plan.highlight ? "text-white/80" : "text-slate-500"}`}>
                  {" "}
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                        plan.highlight ? "bg-white/20" : "bg-emerald-100"
                      }`}
                    >
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className={plan.highlight ? "text-white" : "text-slate-700"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.code)}
                disabled={loadingPlan !== null || currentPlanCode === plan.code}
                className={`w-full rounded-xl px-6 py-4 text-lg font-bold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 ${
                  currentPlanCode === plan.code
                    ? "cursor-default bg-slate-200 text-slate-400"
                    : plan.highlight
                      ? "bg-white text-primary shadow-xl hover:bg-slate-100"
                      : plan.code === "PREMIUM"
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-primary text-white hover:bg-primary/90"
                }`}
              >
                {currentPlanCode === plan.code
                  ? t("home.pricing.currentPlan")
                  : loadingPlan === plan.code
                    ? t("home.pricing.loading")
                    : t("home.pricing.getPlan", { plan: plan.name })}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
