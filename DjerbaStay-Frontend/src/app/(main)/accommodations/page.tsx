"use client";

import { useEffect, useMemo, useState } from "react";

import AccommodationCard from "@/modules/Home/Accommodations/AccommodationCard";
import Icon from "@/components/Icon";
import { ApiError, fetchAccommodations } from "@/lib/backendApi";
import type { Accommodation } from "@/lib/backendApi";
import { useLanguage } from "@/lib/language";

type AccommodationKind = "hotel" | "maison" | "local";
type AccommodationFilter = AccommodationKind | "all";
const PAGE_SIZE = 12;

function toLocalImageUrl(backendUrl: string | null | undefined, name: string): string {
  if (backendUrl && !backendUrl.includes("localhost:4000")) {
    return backendUrl;
  }
  if (backendUrl) {
    const fileName = backendUrl.split("/").pop();
    if (fileName) {
      return `/images/accommodations/${fileName}`;
    }
  }
  if (!backendUrl) return "/images/home/placeholder.svg";
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[&']/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `/images/accommodations/${slug}.png`;
}

export default function AccommodationsPage() {
  const { t } = useLanguage();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<AccommodationFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAccommodations()
      .then((items) => {
        setAccommodations(items);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof ApiError
            ? error.message
            : t("accommodations.loadError");
        setErrorMessage(message);
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filteredAccommodations = useMemo(
    () =>
      selectedKind === "all"
        ? accommodations
        : accommodations.filter((item) => (item.type || "hotel") === selectedKind),
    [accommodations, selectedKind]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAccommodations.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAccommodations = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAccommodations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAccommodations, safeCurrentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="loading" className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-bold">{t("accommodations.title")}</h1>

          {errorMessage && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                setSelectedKind("all");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-primary/10"
              }`}
            >
              <Icon name="apartment" className="size-5" />
              {t("accommodations.all")}
            </button>
            <button
              onClick={() => {
                setSelectedKind("hotel");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "hotel"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-primary/10"
              }`}
            >
              <Icon name="apartment" className="size-5" />
              {t("accommodations.hotels")}
            </button>
            <button
              onClick={() => {
                setSelectedKind("maison");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "maison"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-primary/10"
              }`}
            >
              <Icon name="home" className="size-5" />
              {t("accommodations.guestHouses")}
            </button>
            <button
              onClick={() => {
                setSelectedKind("local");
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 rounded-full px-6 py-3 transition-all ${
                selectedKind === "local"
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 hover:bg-primary/10"
              }`}
            >
              <Icon name="place" className="size-5" />
              {t("accommodations.local")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {paginatedAccommodations.map((item) => (
            <AccommodationCard
              key={item.id}
              id={item.id}
              name={item.name}
              location={item.area || t("accommodations.detail.areaFallback")}
              price="$150"
              rating={item.rating?.toString() || "4.0"}
              imageUrl={toLocalImageUrl(item.imageUrl, item.name)}
              imageAlt={item.name}
            />
          ))}
        </div>

        {filteredAccommodations.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Icon name="search_off" className="size-12 mx-auto mb-4" />
            <p>{t("accommodations.noResults")}</p>
          </div>
        )}

        {filteredAccommodations.length > PAGE_SIZE && (
          <div className="mt-24 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("accommodations.previous")}
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const isActive = safeCurrentPage === pageNumber;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-primary text-white"
                      : "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("accommodations.next")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
