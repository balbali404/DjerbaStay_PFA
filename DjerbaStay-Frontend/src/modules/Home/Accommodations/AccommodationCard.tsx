import Image from "next/image";

import Icon from "@/components/Icon";

interface AccommodationCardProps {
  name: string;
  location: string;
  price: string;
  rating: string;
  imageUrl: string;
  imageAlt: string;
}

export default function AccommodationCard({
  name,
  location,
  price,
  rating,
  imageUrl,
  imageAlt,
}: AccommodationCardProps) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800">
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl">
        <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full text-primary shadow-md">
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
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-amber-500">
            <Icon name="star" className="size-4 fill-current" />
            <span className="text-sm font-bold">{rating}</span>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-sm">
          <Icon name="location_on" className="size-4" />
          {location}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <span className="text-primary text-lg font-extrabold">
            {price}
            <span className="text-slate-400 text-sm font-normal"> / night</span>
          </span>
          <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            Details
            <Icon name="arrow_forward" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
