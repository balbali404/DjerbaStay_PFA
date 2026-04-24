import { HotelStatus } from "@prisma/client";
import { Router } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";

const router = Router();

const ACCOMMODATION_IMAGE_BASE_PATH = "/images/accommodations";
const PLACE_IMAGE_BASE_PATH = "/images/places";
const RESTAURANT_IMAGE_BASE_PATH = "/images/restaurants";

function buildPublicImageUrl(basePath: string, imageFileName: string | null): string | null {
  if (!imageFileName) {
    return null;
  }

  const relativeUrl = `${basePath}/${imageFileName}`;
  if (!env.publicBaseUrl) {
    return relativeUrl;
  }

  return `${env.publicBaseUrl}${relativeUrl}`;
}

/**
 * GET /api/accommodations
 *
 * Optional query params for availability filtering:
 *   startDate  ISO datetime — start of the desired travel period
 *   days       integer      — trip duration in days
 *
 * Always excludes INACTIVE hotels.
 * When dates are provided, also excludes hotels that have an inactive period
 * overlapping [startDate, startDate + days).
 */
router.get("/accommodations", async (req, res) => {
  // Build the date range filter if both params are present
  let dateFilter: { startDate: Date; endDate: Date } | null = null;

  const rawStartDate = req.query.startDate;
  const rawDays = req.query.days;

  if (typeof rawStartDate === "string" && typeof rawDays === "string") {
    const start = new Date(rawStartDate);
    const daysNum = parseInt(rawDays, 10);

    if (!isNaN(start.getTime()) && Number.isFinite(daysNum) && daysNum > 0) {
      const end = new Date(start);
      end.setDate(end.getDate() + daysNum);
      dateFilter = { startDate: start, endDate: end };
    }
  }

  const accommodations = await prisma.accommodation.findMany({
    where: {
      status: HotelStatus.ACTIVE,
      // Exclude hotels with inactive periods overlapping the requested travel window
      ...(dateFilter
        ? {
            NOT: {
              availabilities: {
                some: {
                  startDate: { lte: dateFilter.endDate },
                  endDate: { gte: dateFilter.startDate },
                },
              },
            },
          }
        : {}),
    },
    orderBy: {
      externalId: "asc",
    },
  });

  res.json(
    accommodations.map((item) => ({
      id: item.externalId,
      dbId: item.id,
      name: item.name,
      type: item.type,
      area: item.area,
      imageFileName: item.imageFileName,
      imageUrl: buildPublicImageUrl(ACCOMMODATION_IMAGE_BASE_PATH, item.imageFileName),
      latitude: item.latitude,
      longitude: item.longitude,
      rating: item.rating,
      status: item.status,
    }))
  );
});

router.get("/places", async (req, res) => {
  const rawLimit = Number(req.query.limit || 300);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 2000) : 300;

  const places = await prisma.place.findMany({
    orderBy: {
      externalId: "asc",
    },
    take: limit,
  });

  res.json(
    places.map((item) => ({
      id: item.externalId,
      dbId: item.id,
      name: item.name,
      type: item.type,
      category: item.category,
      imageFileName: item.imageFileName,
      imageUrl: buildPublicImageUrl(PLACE_IMAGE_BASE_PATH, item.imageFileName),
      latitude: item.latitude,
      longitude: item.longitude,
      rating: item.rating,
      durationHours: item.durationHours,
      price: item.price,
      tags: item.tags,
      travelType: item.travelType,
    }))
  );
});

router.get("/restaurants", async (req, res) => {
  const rawLimit = Number(req.query.limit || 300);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 2000) : 300;

  const restaurants = await prisma.restaurant.findMany({
    orderBy: {
      externalId: "asc",
    },
    take: limit,
  });

  res.json(
    restaurants.map((item) => ({
      id: item.externalId,
      dbId: item.id,
      name: item.name,
      imageFileName: item.imageFileName,
      imageUrl: buildPublicImageUrl(RESTAURANT_IMAGE_BASE_PATH, item.imageFileName),
      latitude: item.latitude,
      longitude: item.longitude,
      rating: item.rating,
      price: item.price,
      tags: item.tags,
      travelType: item.travelType,
    }))
  );
});

export default router;
