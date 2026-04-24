import { Role } from "@prisma/client";
import { Router } from "express";
import { Readable } from "stream";

import prisma from "../../config/prisma";
import { authenticateAccessToken, requireRole } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import { createValidationSchema } from "../../core/validators/schemas";
import {
  approveReservation,
  generateInvoicePDF,
  rejectReservation,
} from "./hotel-reservations.service";

const router = Router();

// All routes require hotel admin authentication
router.use(authenticateAccessToken, requireRole(Role.HOTEL_ADMIN, Role.SUPER_ADMIN));

// ─── Helper to get admin's hotel ──────────────────────────────────────────────

async function getAdminHotel(adminUserId: string) {
  return prisma.accommodation.findFirst({
    where: { adminUserId },
  });
}

// ─── Get pending reservations ─────────────────────────────────────────────────

router.get("/pending", async (req, res, next) => {
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
        where: {
          accommodationId: hotel.id,
          approvalStatus: "PENDING",
        },
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
        where: {
          accommodationId: hotel.id,
          approvalStatus: "PENDING",
        },
      }),
    ]);

    res.json({
      data: reservations.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        user: r.user,
        days: r.days,
        persons: r.persons,
        budgetLevel: r.budgetLevel,
        transport: r.transport,
        interests: r.interests,
        travelStartDate: r.travelStartDate,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Get reservation details ─────────────────────────────────────────────────

router.get("/:requestId", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { requestId } = req.params;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const reservation = await prisma.plannerRequest.findFirst({
      where: {
        id: requestId,
        accommodationId: hotel.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        accommodation: {
          select: {
            name: true,
            area: true,
            rating: true,
          },
        },
      },
    });

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.json({
      id: reservation.id,
      createdAt: reservation.createdAt,
      approvalStatus: reservation.approvalStatus,
      approvalNotes: reservation.approvalNotes,
      approvedAt: reservation.approvedAt,
      rejectedAt: reservation.rejectedAt,
      user: reservation.user,
      accommodation: reservation.accommodation,
      days: reservation.days,
      persons: reservation.persons,
      budgetLevel: reservation.budgetLevel,
      transport: reservation.transport,
      interests: reservation.interests,
      travelStartDate: reservation.travelStartDate,
      tripPlan: reservation.tripPlan,
      budgetBreakdown: reservation.budgetBreakdown,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Approve a reservation ───────────────────────────────────────────────────

router.post("/:requestId/approve", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { requestId } = req.params;
    const { notes } = req.body as { notes?: string };

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const updated = await approveReservation(requestId, hotel.id, notes);

    res.json({
      message: "Reservation approved successfully",
      reservation: {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        approvalNotes: updated.approvalNotes,
        approvedAt: updated.approvedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// ─── Reject a reservation ────────────────────────────────────────────────────

router.post("/:requestId/reject", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { requestId } = req.params;
    const { reason } = req.body as { reason?: string };

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const updated = await rejectReservation(requestId, hotel.id, reason);

    res.json({
      message: "Reservation rejected successfully",
      reservation: {
        id: updated.id,
        approvalStatus: updated.approvalStatus,
        approvalNotes: updated.approvalNotes,
        rejectedAt: updated.rejectedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// ─── Download invoice (PDF) ──────────────────────────────────────────────────

router.get("/:requestId/invoice", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const { requestId } = req.params;

    const hotel = await getAdminHotel(userId);
    if (!hotel) {
      res.status(404).json({ error: "No hotel associated with your account" });
      return;
    }

    const reservation = await prisma.plannerRequest.findFirst({
      where: {
        id: requestId,
        accommodationId: hotel.id,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
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

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    // Generate PDF
    const pdf = generateInvoicePDF({
      id: reservation.id,
      createdAt: reservation.createdAt,
      interests: reservation.interests,
      days: reservation.days,
      persons: reservation.persons,
      budgetLevel: reservation.budgetLevel,
      transport: reservation.transport,
      user: reservation.user,
      accommodation: reservation.accommodation,
      budgetBreakdown: reservation.budgetBreakdown as Record<string, number>,
    });

    // Stream the PDF
    res.contentType("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="DjerbaStay-Facture-${reservation.id}.pdf"`
    );

    const stream = pdf as unknown as Readable;
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// ─── Get all reservations with approval status ────────────────────────────────

router.get("/list/all", async (req, res, next) => {
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

    const status = req.query.status as string | undefined;
    const where: Record<string, unknown> = { accommodationId: hotel.id };

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.approvalStatus = status;
    }

    const [reservations, total] = await Promise.all([
      prisma.plannerRequest.findMany({
        where,
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
      prisma.plannerRequest.count({ where }),
    ]);

    res.json({
      data: reservations.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        approvalStatus: r.approvalStatus,
        approvalNotes: r.approvalNotes,
        approvedAt: r.approvedAt,
        rejectedAt: r.rejectedAt,
        user: r.user,
        days: r.days,
        persons: r.persons,
        budgetLevel: r.budgetLevel,
      })),
      total,
      page,
      limit,
      filters: { status: status || "all" },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
