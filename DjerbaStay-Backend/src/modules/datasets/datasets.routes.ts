import { Router } from "express";

import prisma from "../../config/prisma";

const router = Router();

router.get("/traveler-profiles", async (_req, res) => {
  const profiles = await prisma.travelerProfile.findMany({
    orderBy: {
      personality: "asc",
    },
  });

  res.json(profiles);
});

router.get("/synonyms", async (_req, res) => {
  const synonyms = await prisma.synonym.findMany({
    orderBy: {
      term: "asc",
    },
  });

  res.json(synonyms);
});

router.get("/trip-budgets", async (req, res) => {
  const rawLimit = Number(req.query.limit || 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 500;

  const samples = await prisma.tripBudgetSample.findMany({
    orderBy: {
      externalRowId: "asc",
    },
    take: limit,
  });

  res.json(samples);
});

router.get("/summary", async (_req, res) => {
  const [accommodations, places, restaurants, travelerProfiles, synonyms, tripBudgetSamples] =
    await Promise.all([
      prisma.accommodation.count(),
      prisma.place.count(),
      prisma.restaurant.count(),
      prisma.travelerProfile.count(),
      prisma.synonym.count(),
      prisma.tripBudgetSample.count(),
    ]);

  res.json({
    accommodations,
    places,
    restaurants,
    travelerProfiles,
    synonyms,
    tripBudgetSamples,
  });
});

export default router;
