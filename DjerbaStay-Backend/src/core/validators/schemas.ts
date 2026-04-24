import { HotelStatus, SubscriptionCode, TransportMode } from "@prisma/client";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const languagePreferenceSchema = z.object({
  language: z.enum(["en", "fr", "de"]),
});

export const updatePlanSchema = z.object({
  planCode: z.nativeEnum(SubscriptionCode),
});

export const createCheckoutSessionSchema = z.object({
  planCode: z
    .nativeEnum(SubscriptionCode)
    .refine((planCode) => planCode !== SubscriptionCode.FREE, {
      message: "planCode must be PLUS or PREMIUM",
    }),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: emailSchema,
    currentPassword: z.string().min(8).max(128).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .superRefine((value, ctx) => {
    const hasCurrentPassword = Boolean(value.currentPassword);
    const hasNewPassword = Boolean(value.newPassword);

    if (hasCurrentPassword !== hasNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "currentPassword and newPassword must be provided together",
      });
    }

    if (
      value.currentPassword &&
      value.newPassword &&
      value.currentPassword === value.newPassword
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "newPassword must be different from currentPassword",
      });
    }
  });

export const plannerGenerationSchema = z.object({
  accommodationId: z.number().int().positive(),
  interests: z.string().trim().min(2).max(300),
  days: z.number().int().min(1).max(7),
  persons: z.number().int().min(1).max(10),
  budgetLevel: z.number().int().min(1).max(3),
  transport: z.nativeEnum(TransportMode),
  travelStartDate: z.string().datetime().optional(),
});

export const confirmStripeCheckoutSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
});

// ─── Hotel Admin schemas ───────────────────────────────────────────────────

export const hotelStatusUpdateSchema = z.object({
  status: z.nativeEnum(HotelStatus),
});

export const createAvailabilitySchema = z
  .object({
    startDate: z.string().datetime({ message: "startDate must be a valid ISO 8601 datetime" }),
    endDate: z.string().datetime({ message: "endDate must be a valid ISO 8601 datetime" }),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "startDate must be before endDate",
    path: ["endDate"],
  });
