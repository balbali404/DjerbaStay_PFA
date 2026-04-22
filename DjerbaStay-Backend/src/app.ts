import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "node:path";

import { env } from "./config/env";
import { errorHandler } from "./core/middleware/errorHandler";
import authRouter from "./modules/auth/auth.routes";
import billingRouter from "./modules/billing/billing.routes";
import catalogRouter from "./modules/catalog/catalog.routes";
import datasetsRouter from "./modules/datasets/datasets.routes";
import healthRouter from "./modules/health/health.routes";
import mlRouter from "./modules/ml/ml.routes";
import plannerRouter from "./modules/planner/planner.routes";
import recommendationsRouter from "./modules/recommendations/recommendations.routes";
import subscriptionRouter from "./modules/subscription/subscription.routes";

const app = express();

const publicRoot = path.resolve(process.cwd(), "public");

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use("/public", express.static(publicRoot));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/billing", billingRouter);
app.use("/api/ml", mlRouter);
app.use("/api", catalogRouter);
app.use("/api/datasets", datasetsRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/planner", plannerRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
