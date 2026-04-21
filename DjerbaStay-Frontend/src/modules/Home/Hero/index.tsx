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
    <div className="relative px-4 lg:px-20 py-8">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-slate-900 min-h-[600px]">
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
        <div className="flex min-h-[600px] flex-col gap-6 items-center justify-center p-8 text-center relative z-10">
          <div className="max-w-3xl flex flex-col gap-6 z-10">
            <span className="bg-primary/30 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full self-center">
              Welcome to the Island of Dreams
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Discover Your Perfect
              <span className="text-primary-200"> Djerba Stay</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Experience the magic of Tunisia&apos;s hidden gem with personalized,
              ML-powered recommendations tailored to your unique travel style.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Link
                href="/planner"
                className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-lg font-bold shadow-xl hover:scale-105 transition-transform"
              >
                Find My Dream Stay
              </Link>
              <Link
                href="/planner"
                className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white/10 backdrop-blur-md border border-white/30 text-white text-lg font-bold hover:bg-white/20 transition-all"
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
