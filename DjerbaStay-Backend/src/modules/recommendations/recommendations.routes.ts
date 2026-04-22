import { Router } from "express";

import prisma from "../../config/prisma";

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

router.get("/best", async (_req, res, next) => {
  try {
    const rows = await prisma.plannerRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 250,
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
          },
        },
      },
    });

    const candidates = rows
      .map((row) => {
        const tripPlanRecord = asRecord(row.tripPlan);
        const budgetRecord = asRecord(row.budgetBreakdown);
        const confidence = pickNumber(tripPlanRecord, "confidence");
        if (confidence === null) {
          return null;
        }

        const totalCost = pickNumber(budgetRecord, "total_cost") ?? pickNumber(budgetRecord, "totalCost");

        return {
          id: row.id,
          createdAt: row.createdAt,
          confidence,
          personality: pickString(tripPlanRecord, "personality"),
          interests: row.interests,
          days: row.days,
          transport: row.transport,
          budgetLevel: row.budgetLevel,
          userName: row.user.fullName,
          accommodationName: row.accommodation.name,
          accommodationArea: row.accommodation.area,
          topPlaces: extractTopPlaces(row.tripPlan),
          estimatedTotalCost: totalCost,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }

        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    const best = candidates[0] ?? null;
    if (!best) {
      res.json({ recommendation: null });
      return;
    }

    res.json({
      recommendation: {
        id: best.id,
        createdAt: best.createdAt,
        confidence: Number(best.confidence.toFixed(3)),
        personality: best.personality,
        interests: best.interests,
        days: best.days,
        transport: best.transport,
        budgetLevel: best.budgetLevel,
        userName: best.userName,
        accommodation: {
          name: best.accommodationName,
          area: best.accommodationArea,
        },
        topPlaces: best.topPlaces,
        estimatedTotalCost: best.estimatedTotalCost,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
