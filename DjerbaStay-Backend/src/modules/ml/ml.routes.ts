import { Router } from "express";
import { Role } from "@prisma/client";

import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";
import { getMonthStartUtc } from "../../utils/date";
import { loadAuthenticatedUser } from "../auth/auth.service";

const router = Router();

router.get("/usage", authenticateAccessToken, async (req, res, next) => {
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

    // Hotel admins (HOTEL_ADMIN) have unlimited access and should not see plan usage
    if (user.role === Role.HOTEL_ADMIN) {
      res.json({
        planCode: "UNLIMITED",
        used: null,
        limit: null,
        remaining: null,
      });
      return;
    }

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

    const limit = user.plan.monthlyMlRequests;
    const remaining = limit === null ? null : Math.max(limit - usage.mlRequests, 0);

    res.json({
      planCode: user.plan.code,
      used: usage.mlRequests,
      limit,
      remaining,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
