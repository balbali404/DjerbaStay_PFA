import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import type { AccessTokenPayload } from "../core/middleware/auth.middleware";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`FATAL: missing environment variable ${name}`);
  }

  return value;
}

const JWT_ACCESS_SECRET = requiredEnv("JWT_ACCESS_SECRET");
const JWT_REFRESH_SECRET = requiredEnv("JWT_REFRESH_SECRET");
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN_SECONDS = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || "604800", 10);

export const createAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN as any });
};

export const createRefreshToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN_SECONDS,
    jwtid: crypto.randomUUID(),
  });
};

export function verifyRefreshToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.email !== "string" ||
    typeof decoded.plan !== "string"
  ) {
    throw new Error("Invalid refresh token payload");
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
    plan: decoded.plan as AccessTokenPayload["plan"],
    // Backward compat: tokens issued before RBAC default to CLIENT
    role: (decoded.role as Role) ?? Role.CLIENT,
  };
}

export const REFRESH_TOKEN_MAX_AGE_MS = JWT_REFRESH_EXPIRES_IN_SECONDS * 1000;
