import { HotelStatus, TransportMode } from "@prisma/client";
import { Router } from "express";

import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import { plannerGenerationSchema } from "../../core/validators/schemas";
import { getMonthStartUtc } from "../../utils/date";
import { loadAuthenticatedUser } from "../auth/auth.service";
import { jsonValue, requestFlaskJson } from "./planner.service";

const router = Router();

router.post(
  "/generate",
  authenticateAccessToken,
  validateBody(plannerGenerationSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await loadAuthenticatedUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { interests, days, persons, budgetLevel, transport, accommodationId, travelStartDate } =
        req.body as {
          interests: string;
          days: number;
          persons: number;
          budgetLevel: number;
          transport: TransportMode;
          accommodationId: number;
          travelStartDate?: string;
        };

      const monthStart = getMonthStartUtc();
      const usage = await prisma.monthlyUsage.upsert({
        where: {
          userId_monthStart: {
            userId,
            monthStart,
          },
        },
        update: {},
        create: {
          userId,
          monthStart,
        },
      });

      const usageLimit = user.plan.monthlyMlRequests;
      if (usageLimit !== null && usage.mlRequests >= usageLimit) {
        res.status(403).json({
          error: "Monthly AI request limit reached. Upgrade to PLUS or PREMIUM to continue.",
          code: "PLAN_LIMIT_REACHED",
          usage: {
            planCode: user.plan.code,
            used: usage.mlRequests,
            limit: usageLimit,
            remaining: 0,
          },
        });
        return;
      }

      const accommodation = await prisma.accommodation.findUnique({
        where: { externalId: accommodationId },
      });

      if (!accommodation) {
        res.status(404).json({ error: "Accommodation not found" });
        return;
      }

      // ── ML filtering: reject INACTIVE hotels ──────────────────────────────
      if (accommodation.status === HotelStatus.INACTIVE) {
        res.status(422).json({
          error: "This accommodation is currently not available for booking",
          code: "HOTEL_INACTIVE",
        });
        return;
      }

      // ── ML filtering: reject hotels inactive during requested travel dates ─
      if (travelStartDate) {
        const tripStart = new Date(travelStartDate);
        const tripEnd = new Date(tripStart);
        tripEnd.setDate(tripEnd.getDate() + days);

        const conflictingPeriod = await prisma.hotelAvailability.findFirst({
          where: {
            accommodationId: accommodation.id,
            startDate: { lte: tripEnd },
            endDate: { gte: tripStart },
          },
        });

        if (conflictingPeriod) {
          res.status(422).json({
            error: "This accommodation is not available during the selected travel dates",
            code: "HOTEL_UNAVAILABLE_DATES",
            unavailableFrom: conflictingPeriod.startDate,
            unavailableTo: conflictingPeriod.endDate,
          });
          return;
        }
      }

      const [tripPlanResult, budgetResult] = await Promise.all([
        requestFlaskJson("/plan_trip", {
          interests,
          days,
          accommodation_name: accommodation.name,
          accommodation_lat: accommodation.latitude,
          accommodation_lon: accommodation.longitude,
        }),
        requestFlaskJson("/estimate_budget", {
          days,
          persons,
          budget_level: budgetLevel,
          transport,
        }),
      ]);

      const transactionResult = await prisma.$transaction(async (tx) => {
        const createdRequest = await tx.plannerRequest.create({
          data: {
            userId,
            accommodationId: accommodation.id,
            interests,
            days,
            persons,
            budgetLevel,
            transport,
            travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
            tripPlan: jsonValue(tripPlanResult.data),
            budgetBreakdown: jsonValue(budgetResult.data),
            flaskPlanStatus: tripPlanResult.status,
            flaskBudgetStatus: budgetResult.status,
          },
        });

        const updatedUsage = await tx.monthlyUsage.update({
          where: {
            userId_monthStart: {
              userId,
              monthStart,
            },
          },
          data: {
            mlRequests: {
              increment: 1,
            },
          },
        });

        return {
          createdRequest,
          updatedUsage,
        };
      });

      const remaining =
        usageLimit === null
          ? null
          : Math.max(usageLimit - transactionResult.updatedUsage.mlRequests, 0);

      res.status(201).json({
        requestId: transactionResult.createdRequest.id,
        tripPlan: tripPlanResult.data,
        budget: budgetResult.data,
        usage: {
          planCode: user.plan.code,
          used: transactionResult.updatedUsage.mlRequests,
          limit: usageLimit,
          remaining,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/history", authenticateAccessToken, async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const rawLimit = Number(req.query.limit || 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;

    const rows = await prisma.plannerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        accommodation: {
          select: {
            externalId: true,
            name: true,
            area: true,
          },
        },
      },
    });

    res.json(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        interests: row.interests,
        days: row.days,
        persons: row.persons,
        budgetLevel: row.budgetLevel,
        transport: row.transport,
        accommodation: {
          id: row.accommodation.externalId,
          name: row.accommodation.name,
          area: row.accommodation.area,
        },
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticateAccessToken, async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const plannerRequestId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!plannerRequestId) {
      res.status(400).json({ error: "Planner request ID is required" });
      return;
    }

    const plannerRequest = await prisma.plannerRequest.findFirst({
      where: {
        id: plannerRequestId,
        userId,
      },
      include: {
        accommodation: {
          select: {
            externalId: true,
            name: true,
            area: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!plannerRequest) {
      res.status(404).json({ error: "Planner request not found" });
      return;
    }

    res.json({
      id: plannerRequest.id,
      createdAt: plannerRequest.createdAt,
      interests: plannerRequest.interests,
      days: plannerRequest.days,
      persons: plannerRequest.persons,
      budgetLevel: plannerRequest.budgetLevel,
      transport: plannerRequest.transport,
      travelStartDate: plannerRequest.travelStartDate,
      accommodation: {
        id: plannerRequest.accommodation.externalId,
        name: plannerRequest.accommodation.name,
        area: plannerRequest.accommodation.area,
        latitude: plannerRequest.accommodation.latitude,
        longitude: plannerRequest.accommodation.longitude,
      },
      tripPlan: plannerRequest.tripPlan,
      budget: plannerRequest.budgetBreakdown,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
