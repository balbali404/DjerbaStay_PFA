import Stripe from "stripe";

import { env } from "../../config/env";
import { createHttpError } from "../../utils/httpError";

const stripeClient = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

export function ensureStripeReady() {
  if (!stripeClient || !env.stripeSecretKey) {
    throw createHttpError(500, "Stripe is not configured on server");
  }

  return stripeClient;
}
