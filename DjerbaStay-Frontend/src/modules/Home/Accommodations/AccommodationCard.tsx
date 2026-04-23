"use client";

import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";
import { useLanguage } from "@/lib/language";

interface AccommodationCardProps {
  id: number;
  name: string;
  location: string;
  price: string;
  rating: string;
  imageUrl: string;
  imageAlt: string;
}

export default function AccommodationCard({
  id,
  name,
  location,
  price,
  rating,
  imageUrl,
  imageAlt,
}: AccommodationCardProps) {
  const { t } = useLanguage();

  return (
    <Link href={`/accommodations/${id}`}>
      <div className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-primary shadow-md">
            <Icon name="favorite" className="size-4" />
          </div>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">{name}</h3>
            <div className="flex items-center gap-1 text-amber-500">
              <Icon name="star" className="size-4 fill-current" />
              <span className="text-sm font-bold">{rating}</span>
            </div>
          </div>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <Icon name="location_on" className="size-4" />
            {location}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">{t("common.startingFrom")}</span>
              <span className="text-lg font-bold text-primary">{price}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-sm font-medium">{t("common.viewDetails")}</span>
              <Icon name="arrow_forward" className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
