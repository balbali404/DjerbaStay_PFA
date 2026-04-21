import "dotenv/config";

import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "node:crypto";
import path from "node:path";
import express, { type CookieOptions, type Request, type Response } from "express";
import { Prisma, SubscriptionCode, TransportMode } from "@prisma/client";
import Stripe from "stripe";

import prisma from "./config/prisma";
import { authenticateAccessToken } from "./core/middleware/auth.middleware";
import { errorHandler } from "./core/middleware/errorHandler";
import { validateBody } from "./core/middleware/validateRequest";
import {
  createCheckoutSessionSchema,
  confirmStripeCheckoutSchema,
  loginSchema,
  plannerGenerationSchema,
  registerSchema,
  updateProfileSchema,
  updatePlanSchema,
} from "./core/validators/schemas";
import {
  createAccessToken,
  createRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
  verifyRefreshToken,
} from "./utils/generateToken";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:5000";
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripeClient = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");
const ACCOMMODATION_IMAGE_BASE_PATH = "/public/images/accommodations";
const PLACE_IMAGE_BASE_PATH = "/public/images/places";
const RESTAURANT_IMAGE_BASE_PATH = "/public/images/restaurants";

type UserWithPlan = Prisma.UserGetPayload<{
  include: {
    plan: true;
  };
}>;

type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  plan: {
    code: SubscriptionCode;
    name: string;
    monthlyMlRequests: number | null;
    monthlyPriceUsd: number;
  };
};

type FlaskCallResult = {
  status: number;
  data: unknown;
};

function asSafeUser(user: UserWithPlan): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    plan: {
      code: user.plan.code,
      name: user.plan.name,
      monthlyMlRequests: user.plan.monthlyMlRequests,
      monthlyPriceUsd: user.plan.monthlyPriceUsd,
    },
  };
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getMonthStartUtc(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function getRefreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/api/auth",
  };
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}

async function issueAuthSession(user: UserWithPlan, res: Response): Promise<string> {
  const payload = {
    sub: user.id,
    email: user.email,
    plan: user.plan.code,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    },
  });

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
  return accessToken;
}

function getRefreshTokenFromCookie(req: Request): string | null {
  const token = req.cookies?.refreshToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

async function requestFlaskJson(path: string, payload: unknown): Promise<FlaskCallResult> {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = { raw: rawBody };
    }
  }

  if (!response.ok) {
    const fallbackMessage = `Flask service error (${response.status})`;
    const errorMessage =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : fallbackMessage;

    const error = new Error(errorMessage) as Error & { statusCode?: number };
    error.statusCode = 502;
    throw error;
  }

  return {
    status: response.status,
    data: parsedBody,
  };
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function loadAuthenticatedUser(userId: string): Promise<UserWithPlan | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
}

function buildPublicImageUrl(basePath: string, imageFileName: string | null): string | null {
  if (!imageFileName) {
    return null;
  }

  return `${basePath}/${imageFileName}`;
}

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

function ensureStripeReady() {
  if (!stripeClient || !STRIPE_SECRET_KEY) {
    const error = new Error("Stripe is not configured on server") as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  return stripeClient;
}

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/public", express.static(PUBLIC_ROOT));

app.get("/health", async (_req, res) => {
  const planCount = await prisma.subscriptionPlan.count();
  const userCount = await prisma.user.count();

  res.json({
    status: "ok",
    planCount,
    userCount,
  });
});

app.get("/api/subscription/plans", async (_req, res) => {
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

app.post("/api/auth/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body as {
      fullName: string;
      email: string;
      password: string;
    };

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ error: "Email is already in use" });
      return;
    }

    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { code: SubscriptionCode.FREE },
    });

    if (!freePlan) {
      const error = new Error("FREE plan is missing. Run prisma seed first.") as Error & {
        statusCode?: number;
      };
      error.statusCode = 500;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const createdUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        planId: freePlan.id,
      },
      include: { plan: true },
    });

    const accessToken = await issueAuthSession(createdUser, res);

    res.status(201).json({
      accessToken,
      user: asSafeUser(createdUser),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { plan: true },
    });

    if (!existingUser) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = await issueAuthSession(existingUser, res);

    res.json({
      accessToken,
      user: asSafeUser(existingUser),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/refresh", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token is missing" });
      return;
    }

    let decodedPayload: { sub: string };
    try {
      decodedPayload = verifyRefreshToken(refreshToken);
    } catch {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const dbToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt.getTime() <= Date.now()) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Refresh token is no longer valid" });
      return;
    }

    if (dbToken.userId !== decodedPayload.sub) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Refresh token user mismatch" });
      return;
    }

    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = await issueAuthSession(dbToken.user, res);

    res.json({
      accessToken,
      user: asSafeUser(dbToken.user),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    clearRefreshCookie(res);
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authenticateAccessToken, async (req, res, next) => {
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

    res.json({ user: asSafeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.patch(
  "/api/auth/profile",
  authenticateAccessToken,
  validateBody(updateProfileSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { fullName, email, currentPassword, newPassword } = req.body as {
        fullName: string;
        email: string;
        currentPassword?: string;
        newPassword?: string;
      };

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (normalizedEmail !== user.email) {
        const emailOwner = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (emailOwner && emailOwner.id !== userId) {
          res.status(409).json({ error: "Email is already in use" });
          return;
        }
      }

      let nextPasswordHash: string | undefined;
      if (newPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword!, user.passwordHash);
        if (!isCurrentPasswordValid) {
          res.status(401).json({ error: "Current password is incorrect" });
          return;
        }

        nextPasswordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
        },
        include: { plan: true },
      });

      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      const accessToken = await issueAuthSession(updatedUser, res);

      res.json({
        accessToken,
        user: asSafeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/subscription/plan",
  authenticateAccessToken,
  validateBody(updatePlanSchema),
  async (req, res, next) => {
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

      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      const accessToken = await issueAuthSession(updatedUser, res);

      res.json({
        accessToken,
        user: asSafeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/billing/create-checkout-session",
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
        success_url: `${FRONTEND_ORIGIN}/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_ORIGIN}/checkout?status=cancel`,
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

app.get("/api/billing/session/:sessionId", async (req, res, next) => {
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

app.post(
  "/api/billing/confirm-checkout",
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

      await prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

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

app.get("/api/ml/usage", authenticateAccessToken, async (req, res, next) => {
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

app.get("/api/accommodations", async (_req, res) => {
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

app.get("/api/places", async (req, res) => {
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

app.get("/api/restaurants", async (req, res) => {
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

app.get("/api/datasets/traveler-profiles", async (_req, res) => {
  const profiles = await prisma.travelerProfile.findMany({
    orderBy: {
      personality: "asc",
    },
  });

  res.json(profiles);
});

app.get("/api/datasets/synonyms", async (_req, res) => {
  const synonyms = await prisma.synonym.findMany({
    orderBy: {
      term: "asc",
    },
  });

  res.json(synonyms);
});

app.get("/api/datasets/trip-budgets", async (req, res) => {
  const rawLimit = Number(req.query.limit || 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 500;

  const samples = await prisma.tripBudgetSample.findMany({
    orderBy: {
      externalRowId: "asc",
    },
    take: limit,
  });

  res.json(samples);
});

app.get("/api/datasets/summary", async (_req, res) => {
  const [accommodations, places, restaurants, travelerProfiles, synonyms, tripBudgetSamples] =
    await Promise.all([
      prisma.accommodation.count(),
      prisma.place.count(),
      prisma.restaurant.count(),
      prisma.travelerProfile.count(),
      prisma.synonym.count(),
      prisma.tripBudgetSample.count(),
    ]);

  res.json({
    accommodations,
    places,
    restaurants,
    travelerProfiles,
    synonyms,
    tripBudgetSamples,
  });
});

app.get("/api/recommendations/best", async (_req, res, next) => {
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

app.post(
  "/api/planner/generate",
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

      const {
        interests,
        days,
        persons,
        budgetLevel,
        transport,
        accommodationId,
      } = req.body as {
        interests: string;
        days: number;
        persons: number;
        budgetLevel: number;
        transport: TransportMode;
        accommodationId: number;
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
        where: {
          externalId: accommodationId,
        },
      });

      if (!accommodation) {
        res.status(404).json({ error: "Accommodation not found" });
        return;
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
        usageLimit === null ? null : Math.max(usageLimit - transactionResult.updatedUsage.mlRequests, 0);

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

app.get("/api/planner/history", authenticateAccessToken, async (req, res, next) => {
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

app.get("/api/planner/:id", authenticateAccessToken, async (req, res, next) => {
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

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`DjerbaStay backend running on http://localhost:${PORT}`);
});
