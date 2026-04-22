"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AccommodationCard from "./AccommodationCard";
import Icon from "@/components/Icon";

type AccommodationKind = "hotel" | "guestHouse";
type AccommodationFilter = AccommodationKind | "all";

const accommodations = [
  {
    kind: "hotel" as AccommodationKind,
    name: "Radisson Blu Palace",
    location: "Sidi Mahrez Beach, Djerba",
    price: "$210",
    rating: "4.9",
    imageUrl: "/images/home/stay_radisson.jpg",
    imageAlt: "Luxury resort swimming pool with palm trees in Djerba",
  },
  {
    kind: "guestHouse" as AccommodationKind,
    name: "Dar Dhiafa",
    location: "Erriadh Village, Djerba",
    price: "$145",
    rating: "4.8",
    imageUrl: "/images/home/stay-dar-dhiafa.jpg",
    imageAlt: "Traditional white stone architecture boutique hotel in Djerba",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "Hasdrubal Prestige",
    location: "Plage Sidi Mehrez, Djerba",
    price: "$320",
    rating: "5.0",
    imageUrl: "/images/home/stay-hasdrubal.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "Djerba Castille",
    location: "Djerba",
    price: "$316",
    rating: "4.0",
    imageUrl: "/images/home/djerba_castille.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "The Four Seasons Hotel Djerba",
    location: "Djerba",
    price: "$525",
    rating: "4.0",
    imageUrl: "/images/home/four-seasons-djerba.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "Djerba Holiday Beach",
    location: "Djerba",
    price: "$414",
    rating: "4.0",
    imageUrl: "/images/home/djerba_holiday_beach_.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "Caribbean World Djerba",
    location: "Djerba",
    price: "$price to fix",
    rating: "4.0",
    imageUrl: "/images/home/caribbean-world-djerba.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
];

export default function Accommodations() {
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => item.kind === selectedKind),
    [selectedKind]
  );

  const updateArrowState = useCallback(() => {
    const container = carouselRef.current;

    if (!container) return;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScrollLeft - 2);
  }, []);

  const slideByOneCard = useCallback((direction: "left" | "right") => {
    const container = carouselRef.current;

    if (!container) return;

    const firstCard = container.querySelector<HTMLElement>(
      "[data-accommodation-card]"
    );
    const computedStyles = window.getComputedStyle(container);
    const gap = Number.parseFloat(computedStyles.columnGap || computedStyles.gap || "0");
    const cardWidth = firstCard?.getBoundingClientRect().width ?? container.clientWidth * 0.85;
    const offset = cardWidth + gap;

    container.scrollBy({
      left: direction === "right" ? offset : -offset,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const container = carouselRef.current;

    if (!container) return;

    const syncArrowState = () => updateArrowState();

    syncArrowState();
    container.addEventListener("scroll", syncArrowState, { passive: true });
    window.addEventListener("resize", syncArrowState);

    return () => {
      container.removeEventListener("scroll", syncArrowState);
      window.removeEventListener("resize", syncArrowState);
    };
  }, [filteredAccommodations, updateArrowState]);

  useEffect(() => {
    const container = carouselRef.current;

    if (!container) return;

    container.scrollTo({ left: 0, behavior: "smooth" });
    updateArrowState();
  }, [selectedKind, updateArrowState]);

  return (
    <div className="px-4 lg:px-20 py-16 traditional-pattern">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-4">
        <div>
          <h2 className="text-slate-900 dark:text-slate-100 text-3xl md:text-4xl font-extrabold tracking-tight">
            Handpicked Accommodations
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Authentic stays curated for your comfort
          </p>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0">
          <button
            onClick={() => setSelectedKind("all")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-md transition-all ${
              selectedKind === "all"
                ? "bg-primary text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "all"}
          >
            <Icon name="featured_seasonal_and_gifts" className="size-5" />
            All
          </button>
          <button
            onClick={() => setSelectedKind("hotel")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-md transition-all ${
              selectedKind === "hotel"
                ? "bg-primary text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "hotel"}
          >
            <Icon name="hotel" className="size-5" />
            Hotels
          </button>
          <button
            onClick={() => setSelectedKind("guestHouse")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
              selectedKind === "guestHouse"
                ? "bg-primary text-white shadow-md"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "guestHouse"}
          >
            <Icon name="home" className="size-5" />
            Guest Houses
          </button>
        </div>
      </div>
      <div className="relative px-4">
        <button
          type="button"
          onClick={() => slideByOneCard("left")}
          disabled={!canScrollLeft}
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-lg transition hover:bg-white dark:hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Show previous accommodations"
        >
          <Icon name="chevron_left" className="size-6" />
        </button>

        <div
          ref={carouselRef}
          className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory px-14 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {filteredAccommodations.map((item) => (
            <div
              key={item.name}
              data-accommodation-card
              className="min-w-[280px] sm:min-w-[360px] lg:min-w-[380px] snap-start shrink-0"
            >
              <AccommodationCard {...item} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => slideByOneCard("right")}
          disabled={!canScrollRight}
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 shadow-lg transition hover:bg-white dark:hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Show more accommodations"
        >
          <Icon name="chevron_right" className="size-6" />
        </button>
      </div>
    </div>
  );
}
