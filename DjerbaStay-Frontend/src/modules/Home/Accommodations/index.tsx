"use client";

import { useMemo, useState } from "react";

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
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => item.kind === selectedKind),
    [selectedKind]
  );

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {filteredAccommodations.map((item) => (
          <AccommodationCard key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}
