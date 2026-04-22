"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
    imageUrl: "/images/home/stay-radisson.svg",
    imageAlt: "Luxury resort swimming pool with palm trees in Djerba",
  },
  {
    kind: "guestHouse" as AccommodationKind,
    name: "Dar Dhiafa",
    location: "Erriadh Village, Djerba",
    price: "$145",
    rating: "4.8",
    imageUrl: "/images/home/stay-dar-dhiafa.svg",
    imageAlt: "Traditional white stone architecture boutique hotel in Djerba",
  },
  {
    kind: "hotel" as AccommodationKind,
    name: "Hasdrubal Prestige",
    location: "Plage Sidi Mehrez, Djerba",
    price: "$320",
    rating: "5.0",
    imageUrl: "/images/home/stay-hasdrubal.svg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
];

export default function Accommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchAccommodations()
      .then(setAccommodations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => (item.type || "hotel") === selectedKind),
    [accommodations, selectedKind]
  );

  const displayedAccommodations = useMemo(
    () => (showAll ? filteredAccommodations : filteredAccommodations.slice(0, INITIAL_LIMIT)),
    [filteredAccommodations, showAll]
  );

  if (loading) {
    return (
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Icon name="loading" className="size-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setSelectedKind("all")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "all"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
              }`}
              aria-pressed={selectedKind === "all"}
            >
              <Icon name="apartment" className="size-5" />
              All
            </button>
            <button
              onClick={() => setSelectedKind("hotel")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "hotel"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
              }`}
              aria-pressed={selectedKind === "hotel"}
            >
              <Icon name="apartment" className="size-5" />
              Hotels
            </button>
            <button
              onClick={() => setSelectedKind("maison")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "maison"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
              }`}
              aria-pressed={selectedKind === "maison"}
            >
              <Icon name="home" className="size-5" />
              Guest Houses
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 mt-8">
          {displayedAccommodations.map((item) => (
            <AccommodationCard
              key={item.id}
              id={item.id}
              name={item.name}
              location={item.area || "Djerba"}
              price="$150"
              rating={item.rating?.toString() || "4.0"}
              imageUrl={toLocalImageUrl(item.imageUrl, item.name)}
              imageAlt={item.name}
            />
          ))}
        </div>
        {!showAll && filteredAccommodations.length > INITIAL_LIMIT && (
          <div className="flex justify-center mt-8">
            <Link
              href="/accommodations"
              className="flex items-center gap-2 rounded-full bg-primary text-white px-8 py-4 hover:bg-primary/90 transition-all"
            >
              <span>View All ({filteredAccommodations.length})</span>
              <Icon name="arrow_forward" className="size-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}