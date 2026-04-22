import crypto from "node:crypto";

import { Prisma, SubscriptionCode } from "@prisma/client";
import type { CookieOptions, Request, Response } from "express";

import { env } from "../../config/env";
import prisma from "../../config/prisma";
import {
  createAccessToken,
  createRefreshToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../../utils/generateToken";

export type UserWithPlan = Prisma.UserGetPayload<{
  include: {
    plan: true;
  };
}>;

export type SafeUser = {
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

export function asSafeUser(user: UserWithPlan): SafeUser {
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

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/api/auth",
  };
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}

export function getRefreshTokenFromCookie(req: Request): string | null {
  const token = req.cookies?.refreshToken;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function issueAuthSession(user: UserWithPlan, res: Response): Promise<string> {
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
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    },
  });

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());
  return accessToken;
}

export async function loadAuthenticatedUser(userId: string): Promise<UserWithPlan | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeActiveRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
