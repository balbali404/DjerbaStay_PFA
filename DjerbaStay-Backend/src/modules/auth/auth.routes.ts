import bcrypt from "bcryptjs";
import { SubscriptionCode } from "@prisma/client";
import { Router } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";
import { authenticateAccessToken } from "../../core/middleware/auth.middleware";
import { validateBody } from "../../core/middleware/validateRequest";
import {
  languagePreferenceSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../../core/validators/schemas";
import { verifyRefreshToken } from "../../utils/generateToken";
import {
  asSafeUser,
  clearRefreshCookie,
  getRefreshTokenFromCookie,
  hashRefreshToken,
  issueAuthSession,
  loadAuthenticatedUser,
  revokeActiveRefreshTokensForUser,
  revokeRefreshToken,
} from "./auth.service";

const router = Router();

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
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

    const passwordHash = await bcrypt.hash(password, env.passwordSaltRounds);

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

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
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

router.post("/refresh", async (req, res, next) => {
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

    const dbToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
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

router.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    clearRefreshCookie(res);
    res.json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticateAccessToken, async (req, res, next) => {
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

router.get("/preferences", authenticateAccessToken, async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ language: user.language });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/preferences/language",
  authenticateAccessToken,
  validateBody(languagePreferenceSchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { language } = req.body as {
        language: string;
      };

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { language },
        include: { plan: true },
      });

      res.json({
        user: asSafeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/profile",
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

        nextPasswordHash = await bcrypt.hash(newPassword, env.passwordSaltRounds);
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

      await revokeActiveRefreshTokensForUser(userId);
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

export default router;
