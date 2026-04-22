function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const env = {
  port: parseNumber(process.env.PORT, 4000),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:5000",
  passwordSaltRounds: parseNumber(process.env.PASSWORD_SALT_ROUNDS, 10),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  isProduction: process.env.NODE_ENV === "production",
};
