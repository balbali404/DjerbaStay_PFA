import Image from "next/image";
import Link from "next/link";

import Icon from "@/components/Icon";

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
  return (
    <Link href={`/accommodations/${id}`}>
      <div className="group flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer">
        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
          <div className="absolute top-3 right-3 z-10 bg-white/90 p-2 rounded-full text-primary shadow-md">
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
            <h3 className="text-slate-900 text-xl font-bold">
              {name}
            </h3>
            <div className="flex items-center gap-1 text-amber-500">
              <Icon name="star" className="size-4 fill-current" />
              <span className="text-sm font-bold">{rating}</span>
            </div>
          </div>
          <p className="text-slate-500 flex items-center gap-1 text-sm">
            <Icon name="location_on" className="size-4" />
            {location}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Starting from</span>
              <span className="text-lg font-bold text-primary">{price}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-sm font-medium">View Details</span>
              <Icon name="arrow_forward" className="size-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}