"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";

import Icon from "@/components/Icon";
import { fetchAccommodations } from "@/lib/backendApi";
import type { Accommodation } from "@/lib/backendApi";

interface AccommodationPageProps {
  params: Promise<{ id: string }>;
}

function toLocalImageUrl(backendUrl: string | null | undefined): string {
  if (!backendUrl) return "/images/home/placeholder.svg";
  const filename = backendUrl.split("/").pop();
  return `/images/accommodations/${filename}`;
}

function getAccommodationMapUrl(accommodation: Accommodation): string {
  if (accommodation.id === 31) {
    return "https://maps.app.goo.gl/pnPXF5HBUJ8tjSqz7";
  }

  return `https://www.google.com/maps/search/?api=1&query=${accommodation.latitude},${accommodation.longitude}`;
}

export default function AccommodationPage({ params }: AccommodationPageProps) {
  const resolved = use(params);
  const accommodationId = parseInt(resolved.id, 10);

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(accommodationId)) {
      setLoading(false);
      return;
    }

    fetchAccommodations()
      .then((data) => {
        const acc = data.find((a) => a.id === accommodationId);
        if (acc) {
          setAccommodation(acc);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accommodationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="loading" className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!accommodation) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="relative w-full h-[50vh] min-h-[400px]">
        <Image
          src={toLocalImageUrl(accommodation.imageUrl)}
          alt={accommodation.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {accommodation.name}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Icon name="location_on" className="size-5" />
                <span>{accommodation.area || "Djerba"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="star" className="size-5 fill-amber-400 text-amber-400" />
                <span className="font-medium">{accommodation.rating || "4.0"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Experience ultimate relaxation at {accommodation.name}, a premier{" "}
                {accommodation.type === "hotel" ? "hotel" : "accommodation"} in{" "}
                {accommodation.area || "Djerba"}. With exceptional amenities and
                world-class service, your stay will be unforgettable.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["Pool", "WiFi", "Restaurant", "Spa", "Gym", "Parking"].map(
                  (amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                    >
                      <Icon name="check_circle" className="size-5 text-primary" />
                      <span>{amenity}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Location</h2>
              <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Icon name="map" className="size-12 mx-auto mb-2" />
                  <p>Open this stay in Google Maps</p>
                  <p className="text-sm">
                    {accommodation.latitude}, {accommodation.longitude}
                  </p>
                  <Link
                    href={getAccommodationMapUrl(accommodation)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                  >
                    View on Google Maps
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm sticky top-8">
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-slate-400">Starting from</span>
                  <div className="text-3xl font-bold text-primary">$150</div>
                  <span className="text-slate-400">/night</span>
                </div>

                <button className="w-full bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary/90 transition-all">
                  Book Now
                </button>

                <button className="w-full border-2 border-primary text-primary py-4 rounded-xl font-medium hover:bg-primary/10 transition-all flex items-center justify-center gap-2">
                  <Icon name="favorite" className="size-5" />
                  Save to Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
