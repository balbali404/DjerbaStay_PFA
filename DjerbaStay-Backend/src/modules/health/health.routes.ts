import { Router } from "express";

import prisma from "../../config/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const planCount = await prisma.subscriptionPlan.count();
  const userCount = await prisma.user.count();

  res.json({
    status: "ok",
    planCount,
    userCount,
  });
});

export default router;
