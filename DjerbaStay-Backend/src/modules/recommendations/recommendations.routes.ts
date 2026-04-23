import { Router } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";

const router = Router();

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function pickNumber(record: Record<string, unknown> | null, key: string): number | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

function pickString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildAccommodationImageUrl(imageFileName: string | null): string | null {
  if (!imageFileName) {
    return null;
  }

  const relativeUrl = `/images/accommodations/${imageFileName}`;
  if (!env.publicBaseUrl) {
    return relativeUrl;
  }

  return `${env.publicBaseUrl}${relativeUrl}`;
}

function extractVibe(interests: string): string | null {
  const [firstToken] = interests.trim().toLowerCase().split(/\s+/);
  if (!firstToken) {
    return null;
  }

  return ["luxury", "authentic", "beach", "local"].includes(firstToken) ? firstToken : null;
}

function extractTopPlaces(tripPlan: unknown): string[] {
  const tripPlanRecord = asRecord(tripPlan);
  if (!tripPlanRecord) {
    return [];
  }

  const itinerary = asArray(tripPlanRecord.itinerary);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const day of itinerary) {
    const dayRecord = asRecord(day);
    if (!dayRecord) {
      continue;
    }

    const places = asArray(dayRecord.places);
    for (const place of places) {
      const placeRecord = asRecord(place);
      const placeName = pickString(placeRecord, "name");
      if (!placeName || seen.has(placeName)) {
        continue;
      }

      seen.add(placeName);
      result.push(placeName);

      if (result.length >= 3) {
        return result;
      }
    }
  }

  return result;
}

router.get("/best", authenticateAccessToken, async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const row = await prisma.plannerRequest.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
        accommodation: {
          select: {
            name: true,
            area: true,
            imageFileName: true,
          },
        },
      },
    });

    if (!row) {
      res.json({ recommendation: null });
      return;
    }

    const tripPlanRecord = asRecord(row.tripPlan);
    const budgetRecord = asRecord(row.budgetBreakdown);
    const confidence = pickNumber(tripPlanRecord, "confidence") ?? 0;
    const totalCost = pickNumber(budgetRecord, "total_cost") ?? pickNumber(budgetRecord, "totalCost");

    res.json({
      recommendation: {
        id: row.id,
        createdAt: row.createdAt,
        confidence: Number(confidence.toFixed(3)),
        personality: pickString(tripPlanRecord, "personality"),
        interests: row.interests,
        vibe: extractVibe(row.interests),
        days: row.days,
        transport: row.transport,
        budgetLevel: row.budgetLevel,
        userName: row.user.fullName,
        accommodation: {
          name: row.accommodation.name,
          area: row.accommodation.area,
          imageUrl: buildAccommodationImageUrl(row.accommodation.imageFileName),
        },
        topPlaces: extractTopPlaces(row.tripPlan),
        estimatedTotalCost: totalCost,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
