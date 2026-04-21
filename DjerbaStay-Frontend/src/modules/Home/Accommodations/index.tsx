import AccommodationCard from "./AccommodationCard";
import Icon from "@/components/Icon";

const accommodations = [
  {
    name: "Radisson Blu Palace",
    location: "Sidi Mahrez Beach, Djerba",
    price: "$210",
    rating: "4.9",
    imageUrl: "/images/home/stay-radisson.svg",
    imageAlt: "Luxury resort swimming pool with palm trees in Djerba",
  },
  {
    name: "Dar Dhiafa",
    location: "Erriadh Village, Djerba",
    price: "$145",
    rating: "4.8",
    imageUrl: "/images/home/stay-dar-dhiafa.svg",
    imageAlt: "Traditional white stone architecture boutique hotel in Djerba",
  },
  {
    name: "Hasdrubal Prestige",
    location: "Plage Sidi Mehrez, Djerba",
    price: "$320",
    rating: "5.0",
    imageUrl: "/images/home/stay-hasdrubal.svg",
    imageAlt: "Modern beachfront resort pool with cabanas",
  },
];

export default function Accommodations() {
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
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md">
            <Icon name="hotel" className="size-5" />
            Hotels
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold border border-slate-200 dark:border-slate-700 hover:border-primary transition-all">
            <Icon name="home" className="size-5" />
            Guest Houses
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {accommodations.map((item) => (
          <AccommodationCard key={item.name} {...item} />
        ))}
      </div>
    </div>
  );
}
