import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role, SubscriptionCode } from "@prisma/client";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET environment variable");
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  plan: SubscriptionCode;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticateAccessToken = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access token is required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Access token is required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as AccessTokenPayload;
    // Backward compat: tokens issued before RBAC default to CLIENT
    if (!decoded.role) {
      decoded.role = Role.CLIENT;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};

/**
 * Middleware factory that enforces role-based access.
 * Place after authenticateAccessToken in the chain.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }

    next();
  };
};
