import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, SubscriptionCode, TransportMode } from "@prisma/client";
import bcrypt from "bcryptjs";
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
  hotel_id: string;
  name: string;
  type: string;
  area: string;
  latitude: string;
  longitude: string;
  rating: string;
  price_euro: string;
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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildImageFileName(prefix: string, externalId: number, label: string): string {
  if (prefix === "accommodation") {
    const slug = label
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[&']/g, "")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return `${slug}.png`;
  }
  return `${prefix}-${externalId}-${label.toLowerCase().replace(/\s+/g, "-")}.jpg`;
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
    "accommodations_djerba_real.csv"
  );
  const rows = await readCsvRows<AccommodationCsvRow>(accommodationsCsvPath);

  const imageFileNameMap: Record<string, string> = {
    "3792395": "caribbean-world-djerba.jpg",
    "4045883": "djerba_castille.jpg",
    "758612": "djerba_holiday_beach_.jpg",
    "3044172": "El Mouradi Djerba Menzel.png",
    "45967004": "Dar Dhiafa.png",
    "3030736": "Mövenpick Resort & Marine Spa.png",
    "2114393": "radisson-blu-palace-resort-thalasso.png",
    "3450150": "hasdrabal prestige.png",
    "758611": "robinson-club-djerba-bahiya.png",
    "3068045": "Seabel Rym Beach.png",
    "22085477": "Fiesta Beach Club Hotel.png",
    "9031498": "dar jerba hotel .png",
    "22869991": "Yadis Djerba Golf & Spa.png",
    "2195460": "djerba plaza.png",
    "17507971": "Fiesta Beach Club Hotel.png",
    "3911319": "Dar Dhiafa.png",
    "79030558": "four-seasons-djerba.jpg",
    "10675958": "four-seasons-djerba.jpg",
    "5599972": "four-seasons-djerba.jpg",
    "3073554": "hasdrabal prestige.png",
    "7093029": "four-seasons-djerba.jpg",
    "123998102": "four-seasons-djerba.jpg",
    "3066572": "four-seasons-djerba.jpg",
    "2256147": "four-seasons-djerba.jpg",
  };

  for (const row of rows) {
    const externalId = parseNumber(row.hotel_id);
    const imageFileName =
      imageFileNameMap[String(externalId)] ||
      buildImageFileName("accommodation", externalId, row.name);

    await prisma.accommodation.upsert({
      where: {
        externalId,
      },
      update: {
        name: row.name,
        type: parseOptionalString(row.type),
        area: parseOptionalString(row.area),
        imageFileName: imageFileName,
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        priceEuro: parseOptionalNumber(row.price_euro),
      },
      create: {
        externalId,
        name: row.name,
        type: parseOptionalString(row.type),
        area: parseOptionalString(row.area),
        imageFileName: imageFileName,
        latitude: parseNumber(row.latitude),
        longitude: parseNumber(row.longitude),
        rating: parseOptionalNumber(row.rating),
        priceEuro: parseOptionalNumber(row.price_euro),
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

/**
 * Seeds the Radisson Blu Palace Resort & Thalasso hotel admin account.
 *
 * Credentials:
 *   Email:    admin@radissonblu-djerba.tn
 *   Password: RadissonAdmin2024!
 *
 * Idempotent — safe to run multiple times.
 */
async function seedHotelAdmin(): Promise<void> {
  const RADISSON_EXTERNAL_ID = 2114393;
  const ADMIN_EMAIL = "admin@radissonblu-djerba.tn";
  const ADMIN_PASSWORD = "RadissonAdmin2024!";
  const ADMIN_FULL_NAME = "Radisson Blu Admin";

  // Locate the hotel record (must exist — run after seedAccommodations)
  const hotel = await prisma.accommodation.findUnique({
    where: { externalId: RADISSON_EXTERNAL_ID },
  });

  if (!hotel) {
    console.warn(
      `[seed] Radisson Blu (externalId ${RADISSON_EXTERNAL_ID}) not found — skipping hotel admin seed.`
    );
    return;
  }

  // Ensure FREE plan exists
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { code: SubscriptionCode.FREE },
  });

  if (!freePlan) {
    throw new Error("[seed] FREE plan missing — run seedSubscriptionPlans first.");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // Create or update the hotel admin user
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: ADMIN_FULL_NAME,
      role: Role.HOTEL_ADMIN,
      passwordHash,
    },
    create: {
      fullName: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.HOTEL_ADMIN,
      planId: freePlan.id,
    },
  });

  // Link the hotel to this admin (only if not already claimed)
  if (hotel.adminUserId === null || hotel.adminUserId === adminUser.id) {
    await prisma.accommodation.update({
      where: { id: hotel.id },
      data: { adminUserId: adminUser.id },
    });
  } else {
    console.warn(
      `[seed] Radisson Blu is already claimed by a different admin (${hotel.adminUserId}) — skipping link.`
    );
  }

  console.log(`[seed] Hotel admin seeded → ${ADMIN_EMAIL} (id: ${adminUser.id})`);
  console.log(`[seed]   Hotel: ${hotel.name} (externalId: ${RADISSON_EXTERNAL_ID})`);
}

async function run(): Promise<void> {
  await seedSubscriptionPlans();
  await seedAccommodations();
  await seedPlaces();
  await seedRestaurants();
  await seedTravelerProfiles();
  await seedSynonyms();
  await seedTripBudgetSamples();
  await seedHotelAdmin();

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
