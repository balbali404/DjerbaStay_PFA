import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SubscriptionCode, TransportMode } from "@prisma/client";
import { parse } from "csv-parse/sync";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

type AccommodationCsvRow = {
  id: string;
  name: string;
  type: string;
  area: string;
  latitude: string;
  longitude: string;
  rating: string;
};

type PlaceCsvRow = {
  id: string;
  name: string;
  type: string;
  category: string;
  latitude: string;
  longitude: string;
  rating: string;
  duration: string;
  price: string;
  tags: string;
  travel_type: string;
};

type RestaurantCsvRow = {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  rating: string;
  price: string;
  tags: string;
  travel_type: string;
};

type TravelerProfileCsvRow = {
  personality: string;
  keywords: string;
};

type SynonymCsvRow = {
  term: string;
  expansion: string;
};

type TripBudgetCsvRow = {
  days: string;
  persons: string;
  budget_level: string;
  transport: string;
  total_activities: string;
  total_food: string;
  total_transport: string;
  total_cost: string;
};

function resolveRootPath(...segments: string[]): string {
  return path.resolve(__dirname, "..", "..", ...segments);
}

async function readCsvRows<T>(absolutePath: string): Promise<T[]> {
  const fileContent = await fs.readFile(absolutePath, "utf-8");

  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function parseOptionalNumber(value: string): number | null {
  if (!value || !value.trim()) {
    return null;
  }

  return parseNumber(value);
}

function parseOptionalString(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildImageFileName(prefix: string, externalId: number, label: string): string {
  const slug = slugify(label) || "item";
  return `${prefix}-${externalId}-${slug}.jpg`;
}

function parseTransportMode(rawTransport: string): TransportMode {
  const normalized = rawTransport.trim().toLowerCase();

  if (normalized === "taxi") {
    return TransportMode.taxi;
  }

  if (normalized === "car_rental") {
    return TransportMode.car_rental;
  }

  if (normalized === "bus") {
    return TransportMode.bus;
  }

  throw new Error(`Unsupported transport mode in CSV: ${rawTransport}`);
}

async function seedSubscriptionPlans(): Promise<void> {
  const freeFeatures = {
    canSaveHistory: true,
    plannerGeneration: true,
    support: "community",
    refreshTokenAuth: true,
  };

  const plusFeatures = {
    canSaveHistory: true,
    plannerGeneration: true,
    support: "standard",
    refreshTokenAuth: true,
    fasterQueue: true,
  };

  const premiumFeatures = {
    canSaveHistory: true,
    plannerGeneration: true,
    support: "priority",
    refreshTokenAuth: true,
    conciergeSuggestions: true,
  };

  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionCode.FREE },
    update: {
      name: "Free",
      description: "Free plan with monthly ML usage limits.",
      monthlyMlRequests: 10,
      monthlyPriceUsd: 0,
      features: freeFeatures,
    },
    create: {
      code: SubscriptionCode.FREE,
      name: "Free",
      description: "Free plan with monthly ML usage limits.",
      monthlyMlRequests: 10,
      monthlyPriceUsd: 0,
      features: freeFeatures,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionCode.PLUS },
    update: {
      name: "Plus",
      description: "Extended ML request quota and faster planning queue.",
      monthlyMlRequests: 60,
      monthlyPriceUsd: 4.99,
      features: plusFeatures,
    },
    create: {
      code: SubscriptionCode.PLUS,
      name: "Plus",
      description: "Extended ML request quota and faster planning queue.",
      monthlyMlRequests: 60,
      monthlyPriceUsd: 4.99,
      features: plusFeatures,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: SubscriptionCode.PREMIUM },
    update: {
      name: "Premium",
      description: "Unlimited ML itinerary generation and premium support.",
      monthlyMlRequests: null,
      monthlyPriceUsd: 9.99,
      features: premiumFeatures,
    },
    create: {
      code: SubscriptionCode.PREMIUM,
      name: "Premium",
      description: "Unlimited ML itinerary generation and premium support.",
      monthlyMlRequests: null,
      monthlyPriceUsd: 9.99,
      features: premiumFeatures,
    },
  });
}

async function seedAccommodations(): Promise<void> {
  const accommodationsCsvPath = resolveRootPath(
    "DjerbaStay-Ai",
    "data",
    "accommodations_djerba.csv"
  );
  const rows = await readCsvRows<AccommodationCsvRow>(accommodationsCsvPath);

  for (const row of rows) {
    const externalId = parseNumber(row.id);

    await prisma.accommodation.upsert({
      where: {
        externalId,
      },
      update: {
        name: row.name,
        type: parseOptionalString(row.type),
        area: parseOptionalString(row.area),
        imageFileName: buildImageFileName("accommodation", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
      },
      create: {
        externalId,
        name: row.name,
        type: parseOptionalString(row.type),
        area: parseOptionalString(row.area),
        imageFileName: buildImageFileName("accommodation", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
      },
    });
  }
}

async function seedPlaces(): Promise<void> {
  const placesCsvPath = resolveRootPath("DjerbaStay-Ai", "data", "places_djerba.csv");
  const rows = await readCsvRows<PlaceCsvRow>(placesCsvPath);

  for (const row of rows) {
    const externalId = parseNumber(row.id);

    await prisma.place.upsert({
      where: {
        externalId,
      },
      update: {
        name: row.name,
        type: row.type,
        category: row.category,
        imageFileName: buildImageFileName("place", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        durationHours: parseNumber(row.duration),
        price: parseOptionalNumber(row.price),
        tags: row.tags,
        travelType: row.travel_type,
      },
      create: {
        externalId,
        name: row.name,
        type: row.type,
        category: row.category,
        imageFileName: buildImageFileName("place", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        durationHours: parseNumber(row.duration),
        price: parseOptionalNumber(row.price),
        tags: row.tags,
        travelType: row.travel_type,
      },
    });
  }
}

async function seedRestaurants(): Promise<void> {
  const restaurantsCsvPath = resolveRootPath(
    "DjerbaStay-Ai",
    "data",
    "restaurants_djerba.csv"
  );
  const rows = await readCsvRows<RestaurantCsvRow>(restaurantsCsvPath);

  for (const row of rows) {
    const externalId = parseNumber(row.id);

    await prisma.restaurant.upsert({
      where: {
        externalId,
      },
      update: {
        name: row.name,
        imageFileName: buildImageFileName("restaurant", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        price: parseOptionalNumber(row.price),
        tags: row.tags,
        travelType: row.travel_type,
      },
      create: {
        externalId,
        name: row.name,
        imageFileName: buildImageFileName("restaurant", externalId, row.name),
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        price: parseOptionalNumber(row.price),
        tags: row.tags,
        travelType: row.travel_type,
      },
    });
  }
}

async function seedTravelerProfiles(): Promise<void> {
  const profilesCsvPath = resolveRootPath("DjerbaStay-Ai", "data", "traveler_profiles.csv");
  const rows = await readCsvRows<TravelerProfileCsvRow>(profilesCsvPath);

  for (const row of rows) {
    const personality = row.personality.trim().toLowerCase();

    await prisma.travelerProfile.upsert({
      where: { personality },
      update: {
        keywords: row.keywords,
        imageFileName: `profile-${slugify(personality)}.jpg`,
      },
      create: {
        personality,
        keywords: row.keywords,
        imageFileName: `profile-${slugify(personality)}.jpg`,
      },
    });
  }
}

async function seedSynonyms(): Promise<void> {
  const synonymsCsvPath = resolveRootPath("DjerbaStay-Ai", "data", "synonyms.csv");
  const rows = await readCsvRows<SynonymCsvRow>(synonymsCsvPath);

  for (const row of rows) {
    const term = row.term.trim().toLowerCase();

    await prisma.synonym.upsert({
      where: { term },
      update: {
        expansion: row.expansion.trim(),
      },
      create: {
        term,
        expansion: row.expansion.trim(),
      },
    });
  }
}

async function seedTripBudgetSamples(): Promise<void> {
  const budgetsCsvPath = resolveRootPath("DjerbaStay-Ai", "data", "trip_budgets.csv");
  const rows = await readCsvRows<TripBudgetCsvRow>(budgetsCsvPath);

  let rowIndex = 0;
  for (const row of rows) {
    rowIndex += 1;

    await prisma.tripBudgetSample.upsert({
      where: {
        externalRowId: rowIndex,
      },
      update: {
        days: parseNumber(row.days),
        persons: parseNumber(row.persons),
        budgetLevel: parseNumber(row.budget_level),
        transport: parseTransportMode(row.transport),
        totalActivities: parseNumber(row.total_activities),
        totalFood: parseNumber(row.total_food),
        totalTransport: parseNumber(row.total_transport),
        totalCost: parseNumber(row.total_cost),
      },
      create: {
        externalRowId: rowIndex,
        days: parseNumber(row.days),
        persons: parseNumber(row.persons),
        budgetLevel: parseNumber(row.budget_level),
        transport: parseTransportMode(row.transport),
        totalActivities: parseNumber(row.total_activities),
        totalFood: parseNumber(row.total_food),
        totalTransport: parseNumber(row.total_transport),
        totalCost: parseNumber(row.total_cost),
      },
    });
  }
}

async function run(): Promise<void> {
  await seedSubscriptionPlans();
  await seedAccommodations();
  await seedPlaces();
  await seedRestaurants();
  await seedTravelerProfiles();
  await seedSynonyms();
  await seedTripBudgetSamples();

  const [planCount, accCount, placeCount, restaurantCount, profileCount, synonymCount, tripBudgetCount] =
    await Promise.all([
    prisma.subscriptionPlan.count(),
    prisma.accommodation.count(),
    prisma.place.count(),
    prisma.restaurant.count(),
    prisma.travelerProfile.count(),
    prisma.synonym.count(),
    prisma.tripBudgetSample.count(),
  ]);

  console.log(
    `Seed complete: ${planCount} plans, ${accCount} accommodations, ${placeCount} places, ${restaurantCount} restaurants, ${profileCount} traveler profiles, ${synonymCount} synonyms, ${tripBudgetCount} trip budget samples`
  );
}

run()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
