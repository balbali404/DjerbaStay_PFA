"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading slightly before it comes into view
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
        {/* Loading Spinner */}
        {!isVideoLoaded && (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isIntersecting && <source src="/djerba2.mp4" type="video/mp4" />}
        </video>
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center gap-6 p-6 text-center md:min-h-[620px] md:p-8">
          <div className="max-w-3xl flex flex-col gap-6 z-10">
            <span className="bg-primary/30 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full self-center">
              Welcome to the Island of Dreams
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
              Discover Your Perfect
              <span className="text-primary-200"> Djerba Stay</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
              Experience the magic of Tunisia&apos;s hidden gem with personalized,
              ML-powered recommendations tailored to your unique travel style.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/planner"
                className="flex h-14 min-w-[220px] cursor-pointer items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-white shadow-xl transition-transform hover:scale-105"
              >
                Find My Dream Stay
              </Link>
              <Link
                href="/planner"
                className="flex h-14 min-w-[220px] cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
                Explore Planner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
