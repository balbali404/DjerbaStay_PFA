export const MAX_DAYS = 7;
export const DEFAULT_LAT = 33.8076;
export const DEFAULT_LON = 10.8451;

export const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export const transportLabels: Record<string, string> = {
  taxi: "Taxi",
  car_rental: "Car Rental",
  bus: "Local Bus",
};

export const costMap: Record<number, string> = {
  1: "EUR40 - EUR70",
  2: "EUR80 - EUR140",
  3: "EUR150 - EUR400+",
};

export const vibeCards = [
  {
    id: "luxury" as const,
    title: "Luxury",
    subtitle: "Premium comfort",
    image: "/images/planner/vibe-luxury.svg",
  },
  {
    id: "authentic" as const,
    title: "Authentic & Calm",
    subtitle: "Peaceful traditional",
    image: "/images/planner/vibe-authentic.svg",
  },
  {
    id: "beach" as const,
    title: "Beachfront",
    subtitle: "Steps from sand",
    image: "/images/planner/vibe-beach.svg",
  },
  {
    id: "local" as const,
    title: "Local Experience",
    subtitle: "Live like a local",
    image: "/images/planner/vibe-local.svg",
  },
];

export const groupCards = [
  { id: "family" as const, emoji: "👨‍👩‍👧‍👦", label: "Family" },
  { id: "romantic" as const, emoji: "💑", label: "Romantic" },
  { id: "solo" as const, emoji: "🧘", label: "Solo" },
  { id: "friends" as const, emoji: "🎉", label: "Friends" },
  { id: "adventure" as const, emoji: "🏕️", label: "Adventure" },
  { id: "business" as const, emoji: "💼", label: "Business" },
];

export const transportCards = [
  {
    id: "taxi" as const,
    emoji: "🚖",
    title: "Taxi",
    subtitle: "Door-to-door comfort",
  },
  {
    id: "car_rental" as const,
    emoji: "🚗",
    title: "Car Rental",
    subtitle: "Full freedom",
  },
  {
    id: "bus" as const,
    emoji: "🚌",
    title: "Local Bus",
    subtitle: "Budget friendly",
  },
];
