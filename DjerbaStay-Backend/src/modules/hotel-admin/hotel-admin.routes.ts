import { HotelStatus, Role } from "@prisma/client";
import { Router } from "express";

import prisma from "../../config/prisma";
import { authenticateAccessToken, requireRole } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import {
  createAvailabilitySchema,
  hotelStatusUpdateSchema,
} from "../../core/validators/schemas";

const router = Router();

// All hotel admin routes require authentication + HOTEL_ADMIN or SUPER_ADMIN role
router.use(authenticateAccessToken, requireRole(Role.HOTEL_ADMIN, Role.SUPER_ADMIN));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAdminHotel(adminUserId: string) {
  return prisma.accommodation.findFirst({
    where: { adminUserId },
  });
}

// ─── Claim a hotel ───────────────────────────────────────────────────────────
// Allows a HOTEL_ADMIN to claim an unclaimed accommodation by its externalId.
// An accommodation is unclaimed when adminUserId is null.

router.patch("/claim/:externalId", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const externalId = parseInt(req.params.externalId as string, 10);

    if (!Number.isFinite(externalId)) {
      res.status(400).json({ error: "Invalid accommodation ID" });
      return;
    }

    const alreadyManaging = await getAdminHotel(userId);
    if (alreadyManaging) {
      res.status(409).json({ error: "You are already managing a hotel" });
      return;
    }

    const accommodation = await prisma.accommodation.findUnique({
      where: { externalId },
    });

    if (!accommodation) {
      res.status(404).json({ error: "Accommodation not found" });
      return;
    }

    if (accommodation.adminUserId !== null) {
      res.status(409).json({ error: "This accommodation is already managed by another admin" });
      return;
    }

    const updated = await prisma.accommodation.update({
      where: { id: accommodation.id },
      data: { adminUserId: userId },
    });

    res.json({
      message: "Hotel claimed successfully",
      hotel: {
        id: updated.externalId,
        dbId: updated.id,
        name: updated.name,
        status: updated.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Dashboard Overview ───────────────────────────────────────────────────────

router.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account. Use /api/hotel/claim/:id first." });
      return;
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [
      totalReservations,
      thisMonthReservations,
      upcomingInactivePeriods,
    ] = await Promise.all([
      prisma.plannerRequest.count({
        where: { accommodationId: hotel.id },
      }),
      prisma.plannerRequest.count({
        where: {
          accommodationId: hotel.id,
          createdAt: { gte: monthStart },
        },
      }),
      prisma.hotelAvailability.count({
        where: {
          accommodationId: hotel.id,
          endDate: { gte: now },
        },
      }),
    ]);

    res.json({
      hotel: {
        id: hotel.externalId,
        dbId: hotel.id,
        name: hotel.name,
        type: hotel.type,
        area: hotel.area,
        rating: hotel.rating,
        priceEuro: hotel.priceEuro,
        status: hotel.status,
      },
      stats: {
        totalReservations,
        thisMonthReservations,
        upcomingInactivePeriods,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Hotel Status ─────────────────────────────────────────────────────────────

router.patch("/status", validateBody(hotelStatusUpdateSchema), async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { status } = req.body as { status: HotelStatus };

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const updated = await prisma.accommodation.update({
      where: { id: hotel.id },
      data: { status },
    });

    res.json({ status: updated.status });
  } catch (error) {
    next(error);
  }
});

// ─── Availability (Inactive Periods) ─────────────────────────────────────────

router.get("/availability", async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const periods = await prisma.hotelAvailability.findMany({
      where: { accommodationId: hotel.id },
      orderBy: { startDate: "asc" },
    });

    res.json(
      periods.map((p) => ({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate,
        reason: p.reason,
        createdAt: p.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/availability", validateBody(createAvailabilitySchema), async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { startDate, endDate, reason } = req.body as {
      startDate: string;
      endDate: string;
      reason?: string;
    };

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const period = await prisma.hotelAvailability.create({
      data: {
        accommodationId: hotel.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason ?? null,
      },
    });

    res.status(201).json({
      id: period.id,
      startDate: period.startDate,
      endDate: period.endDate,
      reason: period.reason,
      createdAt: period.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/availability/:id", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const periodId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const period = await prisma.hotelAvailability.findFirst({
      where: { id: periodId, accommodationId: hotel.id },
    });

    if (!period) {
      res.status(404).json({ error: "Availability period not found" });
      return;
    }

    await prisma.hotelAvailability.delete({ where: { id: periodId } });

    res.json({ message: "Availability period removed" });
  } catch (error) {
    next(error);
  }
});

// ─── Reservations ─────────────────────────────────────────────────────────────

router.get("/reservations", async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const rawLimit = Number(req.query.limit || 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

    const rawPage = Number(req.query.page || 1);
    const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;

    const [reservations, total] = await Promise.all([
      prisma.plannerRequest.findMany({
        where: { accommodationId: hotel.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.plannerRequest.count({
        where: { accommodationId: hotel.id },
      }),
    ]);

    res.json({
      data: reservations.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        interests: r.interests,
        days: r.days,
        persons: r.persons,
        budgetLevel: r.budgetLevel,
        transport: r.transport,
        travelStartDate: r.travelStartDate,
        user: r.user,
        tripPlan: r.tripPlan,
        budget: r.budgetBreakdown,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

// ─── ML Results ───────────────────────────────────────────────────────────────

router.get("/ml-results", async (req, res, next) => {
  try {
    const userId = req.user!.sub;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const rawLimit = Number(req.query.limit || 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

    const where: Record<string, unknown> = { accommodationId: hotel.id };

    if (req.query.startDate && typeof req.query.startDate === "string") {
      const start = new Date(req.query.startDate);
      if (!isNaN(start.getTime())) {
        where.createdAt = { ...(where.createdAt as object ?? {}), gte: start };
      }
    }

    if (req.query.endDate && typeof req.query.endDate === "string") {
      const end = new Date(req.query.endDate);
      if (!isNaN(end.getTime())) {
        where.createdAt = { ...(where.createdAt as object ?? {}), lte: end };
      }
    }

    const results = await prisma.plannerRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json(
      results.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        interests: r.interests,
        days: r.days,
        travelStartDate: r.travelStartDate,
        user: r.user,
        tripPlan: r.tripPlan,
        budget: r.budgetBreakdown,
      }))
    );
  } catch (error) {
    next(error);
  }
});

// ─── Guides ───────────────────────────────────────────────────────────────────

router.get("/guides", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const guides = await prisma.hotelGuide.findMany({
      where: { accommodationId: hotel.id },
      orderBy: { createdAt: "asc" },
    });

    res.json(
      guides.map((g) => ({
        id: g.id,
        name: g.name,
        specialty: g.specialty,
        phone: g.phone,
        isAvailable: g.isAvailable,
        createdAt: g.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/guides", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const { name, specialty, phone } = req.body as {
      name?: string;
      specialty?: string;
      phone?: string;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Guide name is required" });
      return;
    }

    const guide = await prisma.hotelGuide.create({
      data: {
        accommodationId: hotel.id,
        name: name.trim(),
        specialty: specialty?.trim() || null,
        phone: phone?.trim() || null,
        isAvailable: true,
      },
    });

    res.status(201).json({
      id: guide.id,
      name: guide.name,
      specialty: guide.specialty,
      phone: guide.phone,
      isAvailable: guide.isAvailable,
      createdAt: guide.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/guides/:id", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const guideId = req.params.id as string;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const guide = await prisma.hotelGuide.findFirst({
      where: { id: guideId, accommodationId: hotel.id },
    });

    if (!guide) {
      res.status(404).json({ error: "Guide not found" });
      return;
    }

    const { isAvailable, name, specialty, phone } = req.body as {
      isAvailable?: boolean;
      name?: string;
      specialty?: string;
      phone?: string;
    };

    const updated = await prisma.hotelGuide.update({
      where: { id: guideId },
      data: {
        ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(specialty !== undefined ? { specialty: specialty.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      specialty: updated.specialty,
      phone: updated.phone,
      isAvailable: updated.isAvailable,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/guides/:id", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const guideId = req.params.id as string;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const guide = await prisma.hotelGuide.findFirst({
      where: { id: guideId, accommodationId: hotel.id },
    });

    if (!guide) {
      res.status(404).json({ error: "Guide not found" });
      return;
    }

    await prisma.hotelGuide.delete({ where: { id: guideId } });

    res.json({ message: "Guide removed" });
  } catch (error) {
    next(error);
  }
});

export default router;
