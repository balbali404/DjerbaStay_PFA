import { SubscriptionCode } from "@prisma/client";
import { Router } from "express";

import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import { updatePlanSchema } from "../../core/validators/schemas";
import {
  asSafeUser,
  issueAuthSession,
  loadAuthenticatedUser,
  revokeActiveRefreshTokensForUser,
} from "../auth/auth.service";

const router = Router();

router.get("/plans", async (_req, res) => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ monthlyPriceUsd: "asc" }],
    select: {
      code: true,
      name: true,
      description: true,
      monthlyMlRequests: true,
      monthlyPriceUsd: true,
      features: true,
    },
  });

  res.json(plans);
});

router.post("/plan", authenticateAccessToken, validateBody(updatePlanSchema), async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { planCode } = req.body as {
      planCode: SubscriptionCode;
    };

    const currentUser = await loadAuthenticatedUser(userId);
    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (planCode !== SubscriptionCode.FREE) {
      res.status(403).json({ error: "Paid plans must be upgraded through Stripe checkout" });
      return;
    }

    if (currentUser.plan.code !== SubscriptionCode.FREE) {
      res.status(403).json({ error: "Downgrade to FREE is disabled for paid accounts" });
      return;
    }

    if (currentUser.plan.code === planCode) {
      const accessToken = await issueAuthSession(currentUser, res);
      res.json({
        accessToken,
        user: asSafeUser(currentUser),
      });
      return;
    }

    const targetPlan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!targetPlan) {
      res.status(404).json({ error: "Subscription plan not found" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { planId: targetPlan.id },
      include: { plan: true },
    });

    await revokeActiveRefreshTokensForUser(userId);
    const accessToken = await issueAuthSession(updatedUser, res);

    res.json({
      accessToken,
      user: asSafeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
