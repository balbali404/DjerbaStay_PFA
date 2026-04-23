"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/language";

export default function CallToAction() {
  const { t } = useLanguage();

  return (
    <div className="px-4 py-20 lg:px-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-primary p-12 text-center text-white md:p-20">
        <div className="traditional-pattern absolute inset-0 opacity-10" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h2 className="max-w-4xl text-4xl font-black md:text-6xl">{t("home.cta.title")}</h2>
          <p className="max-w-2xl text-xl font-medium text-white/80">{t("home.cta.description")}</p>
          <Link
            href="/planner"
            className="rounded-2xl bg-white px-12 py-5 text-xl font-black text-primary shadow-2xl transition-colors hover:bg-slate-100"
          >
            {t("home.cta.button")}
          </Link>
        </div>
      </div>
    </div>
  );
}
