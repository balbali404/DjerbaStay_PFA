"use client";

import { useMemo, useState } from "react";

import AccommodationCard from "./AccommodationCard";
import Icon from "@/components/Icon";
import { fetchAccommodations } from "@/lib/backendApi";
import type { Accommodation } from "@/lib/backendApi";

type AccommodationKind = "hotel" | "maison" | "local";
type AccommodationFilter = AccommodationKind | "all";

const accommodations = [
  {
    kind: "hotel" as AccommodationKind,
    name: "Radisson Blu Palace",
    location: "Sidi Mahrez Beach, Djerba",
    price: "$210",
    rating: "4.9",
    imageUrl: "/images/home/stay-radisson.jpg",
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
];

export default function Accommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => (item.type || "hotel") === selectedKind),
    [accommodations, selectedKind]
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

  const displayedAccommodations = useMemo(
    () => filteredAccommodations.slice(0, INITIAL_LIMIT),
    [filteredAccommodations]
  );

  if (loading) {
    return (
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Icon name="loading" className="size-8 animate-spin text-primary" />
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {filteredAccommodations.map((item) => (
          <AccommodationCard key={item.name} {...item} />
        ))}
      </div>
    </section>
  );
}
