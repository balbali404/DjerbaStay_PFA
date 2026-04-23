"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Icon from "@/components/Icon";
import type { Accommodation } from "@/lib/backendApi";
import { fetchAccommodations } from "@/lib/backendApi";
import { useLanguage } from "@/lib/language";
import AccommodationCard from "./AccommodationCard";

type AccommodationKind = "hotel" | "maison" | "local";
type AccommodationFilter = AccommodationKind | "all";

type AccommodationCardItem = {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: string;
  imageUrl: string;
  imageAlt: string;
  kind: AccommodationKind;
};

const FALLBACK_ACCOMMODATIONS: AccommodationCardItem[] = [
  {
    id: 1,
    kind: "hotel",
    name: "Radisson Blu Palace",
    location: "Sidi Mahrez Beach, Djerba",
    price: "$210",
    rating: "4.9",
    imageUrl: "/images/home/stay-radisson.jpg",
    imageAlt: "Luxury resort swimming pool with palm trees in Djerba",
  },
  {
    id: 2,
    kind: "maison",
    name: "Dar Dhiafa",
    location: "Erriadh Village, Djerba",
    price: "$145",
    rating: "4.8",
    imageUrl: "/images/home/stay-dar-dhiafa.jpg",
    imageAlt: "Traditional white stone architecture boutique hotel in Djerba",
  },
  {
    id: 3,
    kind: "hotel",
    name: "Hasdrubal Prestige",
    location: "Plage Sidi Mehrez, Djerba",
    price: "$320",
    rating: "5.0",
    imageUrl: "/images/home/stay-hasdrubal.jpg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
];

const PRICE_BY_KIND: Record<AccommodationKind, string> = {
  hotel: "$180",
  maison: "$130",
  local: "$95",
};

function normalizeKind(value?: string | null): AccommodationKind {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "hotel" || normalized === "maison" || normalized === "local") {
    return normalized;
  }

  return "hotel";
}

function toCardItem(item: Accommodation): AccommodationCardItem {
  const kind = normalizeKind(item.type);
  const fallbackImageByKind: Record<AccommodationKind, string> = {
    hotel: "/images/home/stay-radisson.jpg",
    maison: "/images/home/stay-dar-dhiafa.jpg",
    local: "/images/home/stay-hasdrubal.jpg",
  };

  return {
    id: item.id,
    kind,
    name: item.name,
    location: item.area || "Djerba, Tunisia",
    price: PRICE_BY_KIND[kind],
    rating: String(item.rating ?? "4.5"),
    imageUrl: item.imageUrl || fallbackImageByKind[kind],
    imageAlt: `${item.name} in Djerba`,
  };
}

export default function Accommodations() {
  const { t } = useLanguage();
  const [accommodations, setAccommodations] = useState<AccommodationCardItem[]>(FALLBACK_ACCOMMODATIONS);
  const [loading, setLoading] = useState(true);
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadAccommodations() {
      try {
        const fetched = await fetchAccommodations();
        if (!isMounted || fetched.length === 0) {
          return;
        }

        setAccommodations(fetched.map(toCardItem));
      } catch {
        // Keep fallback cards if API is unavailable.
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAccommodations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => item.kind === selectedKind),
    [accommodations, selectedKind]
  );

  if (loading) {
    return (
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Icon name="loading" className="size-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto space-y-8 px-4">
        <div className="mt-6 flex gap-4 md:mt-0">
          <button
            onClick={() => setSelectedKind("all")}
            className={`flex items-center gap-2 rounded-full px-6 py-2 font-bold shadow-md transition-all ${
              selectedKind === "all"
                ? "bg-primary text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "all"}
          >
            <Icon name="featured_seasonal_and_gifts" className="size-5" />
            {t("home.accommodations.all")}
          </button>
          <button
            onClick={() => setSelectedKind("hotel")}
            className={`flex items-center gap-2 rounded-full px-6 py-2 font-bold shadow-md transition-all ${
              selectedKind === "hotel"
                ? "bg-primary text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "hotel"}
          >
            <Icon name="hotel" className="size-5" />
            {t("home.accommodations.hotels")}
          </button>
          <button
            onClick={() => setSelectedKind("maison")}
            className={`flex items-center gap-2 rounded-full px-6 py-2 font-bold transition-all ${
              selectedKind === "maison"
                ? "bg-primary text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "maison"}
          >
            <Icon name="home" className="size-5" />
            {t("home.accommodations.maison")}
          </button>
          <button
            onClick={() => setSelectedKind("local")}
            className={`flex items-center gap-2 rounded-full px-6 py-2 font-bold transition-all ${
              selectedKind === "local"
                ? "bg-primary text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-700 hover:border-primary"
            }`}
            aria-pressed={selectedKind === "local"}
          >
            <Icon name="apartment" className="size-5" />
            {t("home.accommodations.local")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccommodations.slice(0, 3).map((item) => (
            <AccommodationCard
              key={`${item.id}-${item.name}`}
              id={item.id}
              name={item.name}
              location={item.location}
              price={item.price}
              rating={item.rating}
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
            />
          ))}
        </div>

        {filteredAccommodations.length > 3 && (
          <div className="mt-8 text-center">
            <Link
              href="/accommodations"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white transition-all hover:bg-primary/90"
            >
              {t("home.accommodations.viewAll", { count: filteredAccommodations.length })}
              <Icon name="arrow_forward" className="size-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
