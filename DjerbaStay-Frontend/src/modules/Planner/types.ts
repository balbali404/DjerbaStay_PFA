import type {
  Accommodation,
  BudgetResponse,
  TripPlanResponse,
} from "@/lib/aiClient";

export type WizardStep = 1 | 2 | 3;

export type PlannerState = {
  step: WizardStep;
  vibe: "luxury" | "authentic" | "beach" | "local";
  budgetLevel: 1 | 2 | 3;
  groupType:
    | "family"
    | "romantic"
    | "solo"
    | "friends"
    | "adventure"
    | "business";
  persons: number;
  days: number;
  startDate: Date | null;
  transport: "taxi" | "car_rental" | "bus";
  accId: number | null;
  accName: string | null;
  accLat: number | null;
  accLon: number | null;
  accArea: string | null;
};

export type TripResult = TripPlanResponse & { budget?: BudgetResponse };

export type ToastType = "success" | "error" | "warning";

export type ToastMessage = {
  message: string;
  type: ToastType;
} | null;

export type AccommodationList = Accommodation[];
