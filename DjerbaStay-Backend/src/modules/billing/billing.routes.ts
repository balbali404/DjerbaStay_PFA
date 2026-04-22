import { SubscriptionCode } from "@prisma/client";
import { Router } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import {
  confirmStripeCheckoutSchema,
  createCheckoutSessionSchema,
} from "../../core/validators/schemas";
import {
  asSafeUser,
  issueAuthSession,
  loadAuthenticatedUser,
  revokeActiveRefreshTokensForUser,
} from "../auth/auth.service";
import { ensureStripeReady } from "./billing.service";

const router = Router();

router.post(
  "/create-checkout-session",
  authenticateAccessToken,
  validateBody(createCheckoutSessionSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { planCode } = req.body as { planCode: SubscriptionCode };

      const user = await loadAuthenticatedUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const currentPlan = user.plan.code;
      if (currentPlan === planCode) {
        res.status(409).json({ error: `You are already on the ${planCode} plan` });
        return;
      }

      if (planCode === SubscriptionCode.PLUS && currentPlan === SubscriptionCode.PREMIUM) {
        res.status(409).json({ error: "Premium members cannot switch to Plus. Contact support." });
        return;
      }

      const targetPlan = await prisma.subscriptionPlan.findUnique({
        where: { code: planCode },
      });

      if (!targetPlan) {
        res.status(404).json({ error: "Subscription plan not found" });
        return;
      }

      const priceInCents = Math.round(targetPlan.monthlyPriceUsd * 100);

      const stripe = ensureStripeReady();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: priceInCents,
              product_data: {
                name: `DjerbaStay ${targetPlan.name} Plan`,
                description: `${targetPlan.monthlyMlRequests ?? "Unlimited"} AI requests/month`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${env.frontendOrigin}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.frontendOrigin}/checkout?status=cancel`,
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          targetPlan: planCode,
          source: "djerbastay-web",
        },
      });

      if (!session.url) {
        const error = new Error("Stripe checkout session URL is missing") as Error & {
          statusCode?: number;
        };
        error.statusCode = 500;
        throw error;
      }

      const newAccessToken = await issueAuthSession(user, res);

      res.status(201).json({
        sessionId: session.id,
        checkoutUrl: session.url,
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/session/:sessionId", async (req, res, next) => {
  try {
    const sessionIdParam = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    if (!sessionIdParam) {
      res.status(400).json({ error: "Session ID is required" });
      return;
    }

    const stripe = ensureStripeReady();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionIdParam);

    if (!checkoutSession) {
      res.status(404).json({ error: "Checkout session not found" });
      return;
    }

    res.json({
      status: checkoutSession.status,
      paymentStatus: checkoutSession.payment_status,
      targetPlan: checkoutSession.metadata?.targetPlan || null,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/confirm-checkout",
  authenticateAccessToken,
  validateBody(confirmStripeCheckoutSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { sessionId } = req.body as {
        sessionId: string;
      };

      const stripe = ensureStripeReady();
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (!checkoutSession) {
        res.status(404).json({ error: "Checkout session not found" });
        return;
      }

      const checkoutOwnerId = checkoutSession.metadata?.userId || checkoutSession.client_reference_id;
      if (!checkoutOwnerId || checkoutOwnerId !== userId) {
        res.status(403).json({ error: "This checkout session does not belong to the current user" });
        return;
      }

      const isPaid = checkoutSession.payment_status === "paid" || checkoutSession.status === "complete";
      if (!isPaid) {
        res.status(400).json({
          error: "Checkout session is not paid yet",
          paymentStatus: checkoutSession.payment_status,
          checkoutStatus: checkoutSession.status,
        });
        return;
      }

      const targetPlanCode = checkoutSession.metadata?.targetPlan as SubscriptionCode | undefined;
      if (!targetPlanCode) {
        res.status(400).json({ error: "Checkout session is missing target plan metadata" });
        return;
      }

      const targetPlanRecord = await prisma.subscriptionPlan.findUnique({
        where: { code: targetPlanCode },
      });

      if (!targetPlanRecord) {
        res.status(404).json({ error: "Target plan not found in database" });
        return;
      }

      let user = await loadAuthenticatedUser(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (user.planId !== targetPlanRecord.id) {
        user = await prisma.user.update({
          where: { id: userId },
          data: { planId: targetPlanRecord.id },
          include: { plan: true },
        });
      }

      await revokeActiveRefreshTokensForUser(userId);
      const accessToken = await issueAuthSession(user, res);

      res.json({
        accessToken,
        user: asSafeUser(user),
        checkout: {
          sessionId: checkoutSession.id,
          paymentStatus: checkoutSession.payment_status,
          checkoutStatus: checkoutSession.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
