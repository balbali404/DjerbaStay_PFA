"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AccommodationCard from "@/modules/Home/Accommodations/AccommodationCard";
import Icon from "@/components/Icon";
import { fetchAccommodations } from "@/lib/backendApi";
import type { Accommodation } from "@/lib/backendApi";

type AccommodationKind = "hotel" | "maison" | "local";
type AccommodationFilter = AccommodationKind | "all";

function toLocalImageUrl(backendUrl: string | null | undefined): string {
  if (!backendUrl) return "/images/home/placeholder.svg";
  const filename = backendUrl.split("/").pop();
  return `/images/accommodations/${filename}`;
}

export default function AccommodationsPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="loading" className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-bold">All Accommodations</h1>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setSelectedKind("all")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "all"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
              }`}
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
            >
              <Icon name="home" className="size-5" />
              Guest Houses
            </button>
            <button
              onClick={() => setSelectedKind("local")}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "local"
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
              }`}
            >
              <Icon name="place" className="size-5" />
              Local
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {filteredAccommodations.map((item) => (
            <AccommodationCard
              key={item.id}
              id={item.id}
              name={item.name}
              location={item.area || "Djerba"}
              price="$150"
              rating={item.rating?.toString() || "4.0"}
              imageUrl={toLocalImageUrl(item.imageUrl)}
              imageAlt={item.name}
            />
          ))}
        </div>

        {filteredAccommodations.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Icon name="search_off" className="size-12 mx-auto mb-4" />
            <p>No accommodations found</p>
          </div>
        )}
      </div>
    </main>
  );
}