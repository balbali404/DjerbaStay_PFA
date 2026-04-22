import { Router } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";

const router = Router();

const ACCOMMODATION_IMAGE_BASE_PATH = "/public/images/accommodations";
const PLACE_IMAGE_BASE_PATH = "/public/images/places";
const RESTAURANT_IMAGE_BASE_PATH = "/public/images/restaurants";

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

router.get("/accommodations", async (_req, res) => {
  const accommodations = await prisma.accommodation.findMany({
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
