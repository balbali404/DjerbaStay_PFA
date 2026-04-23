"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/lib/language";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="relative px-4 py-6 sm:px-6 sm:py-8 lg:px-20">
      <div className="relative min-h-[500px] overflow-hidden rounded-3xl bg-slate-900 shadow-2xl md:min-h-[620px]">
        {!isVideoLoaded && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900">
            <div className="size-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isIntersecting && <source src="/djerba2.mp4" type="video/mp4" />}
        </video>
        <div className="absolute inset-0 z-0 bg-black/40" />
        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center gap-6 p-6 text-center md:min-h-[620px] md:p-8">
          <div className="z-10 flex max-w-3xl flex-col gap-6">
            <span className="self-center rounded-full bg-primary/30 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              {t("hero.badge")}
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
              {t("hero.titlePrefix")}
              <span className="text-primary-200"> {t("hero.titleAccent")}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
              {t("hero.description")}
            </p>
            <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/planner"
                className="flex h-14 min-w-[220px] cursor-pointer items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105"
              >
                {t("hero.primaryCta")}
              </Link>
              <Link
                href="/planner"
                className="flex h-14 min-w-[220px] cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                {t("hero.secondaryCta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
